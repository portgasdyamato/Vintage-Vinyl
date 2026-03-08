const express = require('express');
const cors = require('cors');
const { spawn, execFile } = require('child_process');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use((req, res, next) => { res.setHeader('Bypass-Tunnel-Reminder', 'true'); next(); });

// Health Check
app.get('/', (req, res) => res.send('Pippofy Backend is running!'));

// ─── Download & Stream (YouTube or any yt-dlp supported URL) ──────────────
app.get('/download', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('No URL provided');

  // First, get duration so we can set Content-Length for proper seeking
  const infoProc = spawn('yt-dlp', [
    '--print', '%(duration)s',
    '--no-playlist',
    '--cookies', 'cookies.txt',
    url
  ]);

  let durationStr = '';
  infoProc.stdout.on('data', d => durationStr += d.toString());

  infoProc.on('close', () => {
    const duration = parseFloat(durationStr.trim());
    // Estimate: ~128kbps = 16000 bytes/sec
    const estimatedBytes = isFinite(duration) ? Math.floor(duration * 16000) : undefined;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
    if (estimatedBytes) res.setHeader('Content-Length', estimatedBytes);

    const ytdlp = spawn('yt-dlp', [
      '-f', 'bestaudio',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '5',
      '--no-playlist',
      '--cookies', 'cookies.txt',
      '-o', '-',
      url
    ]);

    ytdlp.stdout.pipe(res);
    ytdlp.stderr.on('data', data => console.error(`yt-dlp: ${data}`));
    ytdlp.on('error', err => {
      console.error('yt-dlp spawn error:', err);
      if (!res.headersSent) res.status(500).send('Streaming Error');
    });
    req.on('close', () => ytdlp.kill('SIGTERM'));
  });

  infoProc.on('error', () => {
    // Fallback: just stream without Content-Length
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
    const ytdlp = spawn('yt-dlp', [
      '-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3',
      '--audio-quality', '5', '--no-playlist', '--cookies', 'cookies.txt', '-o', '-', url
    ]);
    ytdlp.stdout.pipe(res);
    ytdlp.stderr.on('data', data => console.error(`yt-dlp: ${data}`));
    req.on('close', () => ytdlp.kill('SIGTERM'));
  });
});

// ─── Search YouTube (no API key — scrapes HTML) ───────────────────────────
app.get('/search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send('No query provided');

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;

  https.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      const match = data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        res.json({ videoId: match[1] });
      } else {
        res.status(404).send('No results found');
      }
    });
  }).on('error', err => {
    console.error('YouTube search error:', err);
    res.status(500).send('Search failed');
  });
});

// ─── Spotify Single Track → title via yt-dlp metadata ────────────────────
// Resolves a spotify.com/track/... or spotify.link/... URL server-side,
// completely bypassing CORS since it runs on the server.
app.get('/spotify-track', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('No URL provided');

  // yt-dlp can read Spotify track metadata without downloading
  const ytdlp = spawn('yt-dlp', [
    '--print', '%(title)s|||%(uploader)s',
    '--no-playlist',
    '--no-download',
    '--cookies', 'cookies.txt',
    url
  ]);

  let output = '';
  let errOutput = '';
  ytdlp.stdout.on('data', d => output += d.toString());
  ytdlp.stderr.on('data', d => errOutput += d.toString());

  ytdlp.on('close', (code) => {
    const trimmed = output.trim();
    if (code === 0 && trimmed) {
      const parts = trimmed.split('|||');
      const title = parts[0] ? parts[0].trim() : '';
      const artist = parts[1] ? parts[1].trim() : '';
      const searchQuery = artist ? `${title} ${artist}` : title;
      return res.json({ title, artist, searchQuery });
    }

    // Fallback: try Spotify oEmbed via server-side HTTP
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    https.get(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Pippofy/1.0)' }
    }, (r) => {
      let body = '';
      r.on('data', c => body += c);
      r.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.title) return res.json({ title: json.title, artist: '', searchQuery: json.title });
        } catch (_) {}
        res.status(404).send('Could not resolve Spotify track');
      });
    }).on('error', () => res.status(500).send('Spotify track resolution failed'));
  });
});

// ─── Spotify Playlist → track list ────────────────────────────────────────
// Strategy: use yt-dlp flat extraction (most reliable), fall back to embed scrape
app.get('/spotify-playlist', (req, res) => {
  const inputUrl = req.query.url;
  if (!inputUrl) return res.status(400).send('No URL provided');

  // Strategy 1: yt-dlp flat playlist extraction
  const ytdlp = spawn('yt-dlp', [
    '--flat-playlist',
    '--print', '%(title)s|||%(uploader)s',
    '--cookies', 'cookies.txt',
    inputUrl
  ]);

  let output = '';
  let errOutput = '';
  ytdlp.stdout.on('data', d => output += d.toString());
  ytdlp.stderr.on('data', d => errOutput += d.toString());

  ytdlp.on('close', (code) => {
    const lines = output.trim().split('\n').filter(l => l.trim() && l !== 'NA|||NA');
    if (code === 0 && lines.length > 0) {
      const tracks = lines.map(line => {
        const parts = line.split('|||');
        const title = parts[0] ? parts[0].trim() : '';
        const artist = parts[1] ? parts[1].trim() : '';
        return artist && artist !== 'NA' ? `${title} ${artist}` : title;
      }).filter(t => t.length > 0);

      if (tracks.length > 0) return res.json({ tracks });
    }

    // Strategy 2: Scrape Spotify embed page
    console.log('yt-dlp playlist failed, falling back to embed scrape...');
    const playlistIdMatch = inputUrl.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!playlistIdMatch) return res.status(400).send('Invalid Spotify playlist URL');

    const embedUrl = `https://open.spotify.com/embed/playlist/${playlistIdMatch[1]}?utm_source=generator`;

    https.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return res.status(404).send('Spotify redirected — playlist may be private');
      }

      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          // Try __NEXT_DATA__ (older embed format)
          const nextMatch = data.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
          if (nextMatch) {
            const json = JSON.parse(nextMatch[1]);
            // Try multiple known paths
            const trackList =
              json?.props?.pageProps?.state?.data?.entity?.trackList ||
              json?.props?.pageProps?.state?.data?.entity?.items ||
              json?.props?.pageProps?.entity?.trackList;

            if (trackList && trackList.length > 0) {
              const tracks = trackList.map(t => {
                const title = t.title || t.name || '';
                const artist = t.subtitle || (t.artists && t.artists[0]?.name) || '';
                return artist ? `${title} ${artist}` : title;
              }).filter(t => t.length > 0);
              if (tracks.length > 0) return res.json({ tracks });
            }
          }

          // Try extracting track titles from JSON-LD or og:title tags
          const titleMatches = [...data.matchAll(/"name":"([^"]+)","type":"track"/g)];
          if (titleMatches.length > 0) {
            const tracks = titleMatches.map(m => m[1]);
            return res.json({ tracks });
          }

          res.status(404).send('Could not extract tracks from Spotify playlist');
        } catch (err) {
          console.error('Spotify parse error:', err.message);
          res.status(500).send('Parse error');
        }
      });
    }).on('error', err => {
      console.error('Spotify fetch error:', err);
      res.status(500).send('Spotify fetch failed');
    });
  });
});

// ─── Spotify Album → track list ───────────────────────────────────────────
app.get('/spotify-album', (req, res) => {
  const inputUrl = req.query.url;
  if (!inputUrl) return res.status(400).send('No URL provided');

  const ytdlp = spawn('yt-dlp', [
    '--flat-playlist',
    '--print', '%(title)s|||%(uploader)s',
    '--cookies', 'cookies.txt',
    inputUrl
  ]);

  let output = '';
  ytdlp.stdout.on('data', d => output += d.toString());
  ytdlp.stderr.on('data', d => console.error(`yt-dlp album: ${d}`));

  ytdlp.on('close', (code) => {
    const lines = output.trim().split('\n').filter(l => l.trim() && l !== 'NA|||NA');
    if (code === 0 && lines.length > 0) {
      const tracks = lines.map(line => {
        const parts = line.split('|||');
        const title = parts[0] ? parts[0].trim() : '';
        const artist = parts[1] ? parts[1].trim() : '';
        return artist && artist !== 'NA' ? `${title} ${artist}` : title;
      }).filter(t => t.length > 0);
      return res.json({ tracks });
    }
    res.status(404).send('Could not extract album tracks');
  });
});

app.listen(PORT, () => console.log(`Backend running on ${PORT}`));