const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/download', (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('No URL provided');
  }
  res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
  // Use the full path to yt-dlp.exe and ffmpeg.exe
  const ytdlpPath = 'C:/Users/HP/AppData/Local/Microsoft/WinGet/Packages/yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe/yt-dlp.exe';
  const ffmpegPath = 'C:/ffmpeg/bin/ffmpeg.exe'; // <-- update if your path is different

  console.log('Spawning yt-dlp with:', ytdlpPath, ffmpegPath, url);
  const ytdlp = spawn(ytdlpPath, [
    '-f', 'bestaudio',
    '--extract-audio',
    '--audio-format', 'mp3',
    '--ffmpeg-location', ffmpegPath,
    '-o', '-',
    url
  ]);

  ytdlp.stdout.pipe(res);
  ytdlp.stderr.on('data', (data) => {
    console.error(`yt-dlp error: ${data}`);
  });
  ytdlp.on('error', (err) => {
    console.error('yt-dlp process error:', err);
    res.status(500).send('Error running yt-dlp');
  });
  ytdlp.on('close', (code) => {
    console.log('yt-dlp process exited with code', code);
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
}); 