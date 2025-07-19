# Vinyl Music Player

## Introduction
Vinyl is a modern, interactive web music player that brings the nostalgia of vinyl records to your browser. It features a beautiful vinyl-style UI, animated controls, and seamless integration with YouTube. Users can queue up YouTube videos or playlists, control playback with a classic turntable interface, and even download MP3 versions of songs directly from the app using a custom backend.

## Features
- 🎵 **YouTube Queue & Playlist:** Add individual YouTube videos or entire playlists to your queue.
- 🕹️ **Vinyl-Style UI:** Enjoy a visually rich, animated vinyl record and tonearm for playback.
- 🌀 **Animated Controls:** Play, pause, skip, repeat, and clear the queue with smooth, interactive buttons.
- ⬇️ **Direct MP3 Download:** Download the current playing song as an MP3 using the built-in backend (yt-dlp + ffmpeg).
- 📱 **Responsive Design:** Works beautifully on desktop and mobile devices.
- 🎨 **Customizable & Modern:** Built with React, Tailwind CSS, and framer-motion for a sleek, modern experience.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

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
