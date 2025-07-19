# 🎵 Vintage Vinyl

> “Not just a player, a whole mood — Vintage Vinyl.”

Bringing vinyl vibes to the web.  
A cozy, ad-free music player that spins like the good old days.

[🌐 Check it out](https://lnkd.in/gENX7_DY)

---

## Introduction
Vinyl is a modern, interactive web music player that brings the nostalgia of vinyl records to your browser. It features a beautiful vinyl-style UI, animated controls, and seamless integration with YouTube. Users can queue up YouTube videos or playlists, control playback with a classic turntable interface, and even download MP3 versions of songs directly from the app using a custom backend.

## ✨ Features
- 🎵 **YouTube Queue & Playlist:** Add individual YouTube videos or entire playlists to your queue.
- 🕹️ **Vinyl-Style Animated UI:** Spinning record, moving tonearm, and retro controls.
- 🌀 **Smooth Animated Controls:** Play, pause, skip, repeat, and clear the queue with interactive buttons.
- ⬇️ **Direct MP3 Download:** Download the currently playing song as an MP3 (yt-dlp + ffmpeg backend).
- 📺 **Ad-Free Playback via YouTube:** Enjoy music without interruptions.
- 🎶 **Supports Playlists & Single Tracks:** Flexible queue management.
- 📜 **Queue List with Thumbnails:** See what’s coming up, complete with video thumbnails and titles.
- 🧼 **Clean Retro Aesthetic:** Soft tones, warm minimalism, and modern design.
- ⚡ **Lightweight & Responsive:** Fast, fluid, and works beautifully on desktop and mobile.
- 🎨 **Customizable & Modern:** Built with React, Tailwind CSS, framer-motion, and more.
- 🛠️ **Backend Integration:** Express server with CORS, yt-dlp, and ffmpeg for YouTube-to-MP3 conversion.

---

## 🛠️ Tech Stack

| Tech         | Purpose/Usage                        |
|--------------|--------------------------------------|
| ReactJS      | UI Framework                         |
| Vite         | Frontend build tool/bundler          |
| Tailwind CSS | Styling (utility-first CSS)          |
| framer-motion| Animations and transitions           |
| Express      | Backend server for downloads         |
| yt-dlp       | YouTube video/audio downloader       |
| ffmpeg       | Audio conversion to MP3 (backend)    |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 14
- npm or yarn

### Installation

```bash
git clone https://github.com/portgasdyamato/Vintage-Vinyl.git
cd Vintage-Vinyl
npm install
npm run dev
```

---

## Backend for YouTube-to-MP3 Downloads

1. Go to the `backend` folder:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the backend server:
   ```sh
   node server.js
   ```
4. The backend will run on `http://localhost:3001`. The frontend will connect to this server for MP3 downloads.

**Note:** You need `yt-dlp` installed on your system and available in your PATH. Download it from https://github.com/yt-dlp/yt-dlp/releases if you don't have it.

## Backend Setup: YouTube-to-MP3 Downloads

### 1. Install yt-dlp
- Download yt-dlp for Windows: https://github.com/yt-dlp/yt-dlp/releases/latest
- You can use `winget install yt-dlp` or download the .exe directly.
- Find the full path to `yt-dlp.exe` (e.g., `C:/Users/HP/AppData/Local/Microsoft/WinGet/Packages/yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe/yt-dlp.exe`).

### 2. Install ffmpeg
- Download from https://www.gyan.dev/ffmpeg/builds/
- Extract the ZIP, e.g., to `C:/ffmpeg/`
- Add `C:/ffmpeg/bin` to your system PATH (see below).
- Or, use the full path to `ffmpeg.exe` in your backend code.

### 3. Update backend/server.js
- Set the full path to yt-dlp and ffmpeg:
  ```js
  const ytdlpPath = 'C:/Users/HP/AppData/Local/Microsoft/WinGet/Packages/yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe/yt-dlp.exe';
  const ffmpegPath = 'C:/ffmpeg/bin/ffmpeg.exe';
  ```
- Save and restart your backend:
  ```sh
  cd backend
  node server.js
  ```

### 4. Test the Backend
- Use your app's download button.
- If you get a 0-byte file or ERR_INVALID_RESPONSE, check your backend terminal for errors.
- Common error: `ENOENT` means the path to yt-dlp.exe or ffmpeg.exe is wrong.

### 5. Troubleshooting
- If the download hangs or is 0 bytes, check the backend terminal for errors.
- If you see `'yt-dlp.exe' is not recognized`, update the path in server.js.
- If you see `ffmpeg not found`, update the ffmpeg path or add it to your PATH.
- Always restart your backend after making changes.

---
