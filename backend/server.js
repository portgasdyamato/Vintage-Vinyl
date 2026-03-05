const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use((req, res, next) => { res.setHeader('Bypass-Tunnel-Reminder', 'true'); next(); });

// Health Check
app.get('/', (req, res) => res.send('Pippofy Backend is running!'));

// Download & Stream
app.get('/download', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('No URL provided');
  
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
  
  const ytdlp = spawn('yt-dlp', [
    '-f', 'bestaudio',
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '5',
    '--cookies', 'cookies.txt',
    '-o', '-',
    url
  ]);

  ytdlp.stdout.pipe(res);
  ytdlp.stderr.on('data', (data) => console.error(`yt-dlp: ${data}`));
  ytdlp.on('error', (err) => res.status(500).send('Streaming Error'));
});

// Search without API Key (using yt-dlp)
app.get('/search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).send('No query provided');

  const ytdlp = spawn('yt-dlp', [
    'ytsearch1:' + query,
    '--get-id'
  ]);

  let videoId = '';
  ytdlp.stdout.on('data', (data) => videoId += data.toString().trim());
  ytdlp.on('close', () => {
    if (videoId) res.json({ videoId });
    else res.status(404).send('No results');
  });
});

// Spotify Playlist Scraping
app.get('/spotify-playlist', (req, res) => {
  const inputUrl = req.query.url;
  if (!inputUrl) return res.status(400).send('No URL provided');
  const playlistIdMatch = inputUrl.match(/playlist\/([a-zA-Z0-9]+)/);
  if (!playlistIdMatch) return res.status(400).send('Invalid Spotify playlist URL');
  
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistIdMatch[1]}`;

  https.get(embedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
  }, (response) => {
    let data = '';
    response.on('data', (chunk) => data += chunk);
    response.on('end', () => {
      try {
        const nextDataMatch = data.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
        if (nextDataMatch) {
          const json = JSON.parse(nextDataMatch[1]);
          const trackList = json.props?.pageProps?.state?.data?.entity?.trackList;
          if (trackList) {
            return res.json({ tracks: trackList.map(t => `${t.title} ${t.subtitle}`) });
          }
        }
        res.status(404).send('Tracks not found');
      } catch (err) { res.status(500).send('Parse error'); }
    });
  });
});

app.listen(PORT, () => console.log(`Backend running on ${PORT}`));