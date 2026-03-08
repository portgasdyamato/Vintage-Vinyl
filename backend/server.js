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

// ─── Search YouTube — HTML scrape first, yt-dlp fallback ─────────────────
app.get('/search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send('No query provided');

  // Stage 1: Fast HTML scrape
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
        console.log(`[search] Scrape hit for: ${query}`);
        return res.json({ videoId: match[1] });
      }
      // Stage 2: Fallback to yt-dlp ytsearch (always works)
      console.log(`[search] Scrape miss, falling back to yt-dlp for: ${query}`);
      ytdlpSearch(query, res);
    });
  }).on('error', () => {
    console.log(`[search] Scrape error, falling back to yt-dlp for: ${query}`);
    ytdlpSearch(query, res);
  });
});

function ytdlpSearch(query, res) {
  const ytdlp = spawn('yt-dlp', [
    `ytsearch1:${query}`,
    '--print', '%(id)s',
    '--no-playlist',
    '--skip-download'
  ]);

  let output = '';
  let errOutput = '';
  ytdlp.stdout.on('data', d => output += d.toString());
  ytdlp.stderr.on('data', d => errOutput += d.toString());

  ytdlp.on('close', (code) => {
    const videoId = output.trim().split('\n')[0].trim();
    if (code === 0 && videoId && videoId.length === 11) {
      console.log(`[search] yt-dlp found: ${videoId}`);
      return res.json({ videoId });
    }
    console.error(`[search] yt-dlp failed: ${errOutput}`);
    res.status(404).send('No results found');
  });

  ytdlp.on('error', (err) => {
    console.error('[search] yt-dlp spawn error:', err);
    res.status(500).send('Search failed');
  });
}

// ─── Spotify Single Track resolver ────────────────────────────────────────
// 3-stage chain: oEmbed → og:title scrape → URL slug fallback
app.get('/spotify-track', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('No URL provided');

  // Extract track ID for direct page URL
  const trackIdMatch = url.match(/track\/([a-zA-Z0-9]+)/);
  const pageUrl = trackIdMatch
    ? `https://open.spotify.com/track/${trackIdMatch[1]}`
    : url;

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };

  // Stage 1: oEmbed (fastest)
  const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(pageUrl)}`;
  https.get(oembedUrl, { headers: HEADERS }, (r) => {
    // Handle redirect
    if ((r.statusCode === 301 || r.statusCode === 302) && r.headers.location) {
      return tryOgScrape(pageUrl, HEADERS, url, res);
    }
    let body = '';
    r.on('data', c => body += c);
    r.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (json.title && json.title !== 'Spotify') {
          console.log(`[spotify-track] oEmbed success: ${json.title}`);
          // oEmbed title format: "Song Name" (artist is separate in provider)
          // Try to get better search query by also getting artist from page
          return res.json({ title: json.title, artist: '', searchQuery: json.title });
        }
      } catch (_) {}
      tryOgScrape(pageUrl, HEADERS, url, res);
    });
  }).on('error', () => tryOgScrape(pageUrl, HEADERS, url, res));
});

function tryOgScrape(pageUrl, headers, originalUrl, res) {
  // Stage 2: Scrape og:title from Spotify track page
  console.log(`[spotify-track] Scraping og:title from ${pageUrl}`);
  https.get(pageUrl, { headers }, (r) => {
    if ((r.statusCode === 301 || r.statusCode === 302) && r.headers.location) {
      return trySlugFallback(originalUrl, res);
    }
    let html = '';
    r.on('data', c => { html += c; if (html.length > 50000) r.destroy(); });
    r.on('end', () => {
      // og:title for Spotify tracks: "Song Name - song by Artist"
      const ogMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i)
        || html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:title"/i);

      if (ogMatch && ogMatch[1]) {
        let raw = ogMatch[1].replace(' | Spotify', '').replace(' on Spotify', '').trim();
        // Format: "Song Name - song by Artist Name" → extract "Song Name Artist Name"
        const byMatch = raw.match(/^(.+?)\s+-\s+(?:song|single|track)\s+by\s+(.+)$/i);
        if (byMatch) {
          const title = byMatch[1].trim();
          const artist = byMatch[2].trim();
          console.log(`[spotify-track] og:title success: ${title} - ${artist}`);
          return res.json({ title, artist, searchQuery: `${title} ${artist}` });
        }
        // Plain og:title without "song by"
        console.log(`[spotify-track] og:title plain: ${raw}`);
        return res.json({ title: raw, artist: '', searchQuery: raw });
      }
      trySlugFallback(originalUrl, res);
    });
    r.on('error', () => trySlugFallback(originalUrl, res));
  }).on('error', () => trySlugFallback(originalUrl, res));
}

function trySlugFallback(url, res) {
  // Stage 3: Parse readable text from the URL itself as last resort
  // e.g. spotify.com/track/abc → at least the ID so we can search
  console.log(`[spotify-track] All stages failed for ${url}`);
  res.status(404).send('Could not resolve Spotify track metadata');
}


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