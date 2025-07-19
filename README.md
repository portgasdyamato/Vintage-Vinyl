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

### Deploying on Railway (Recommended)

1. Go to the `backend` folder:
   ```sh
   cd backend
   ```
2. Make sure you have a `Dockerfile` in the `backend/` directory (already included in this repo).
3. The Dockerfile will install `ffmpeg` and `yt-dlp` for you in the Railway environment.
4. In your `server.js`, the following lines ensure the correct binaries are used:
   ```js
   const ytdlpPath = 'yt-dlp'; // Linux binary in PATH
   const ffmpegPath = 'ffmpeg'; // Linux binary in PATH
   ```
5. Push your code to GitHub.
6. On Railway:
   - Create a new project and add a service with the root directory set to `backend/`.
   - Railway will detect the Dockerfile and build your backend.
   - Once deployed, you’ll get a public backend URL (e.g., `https://your-backend-name.up.railway.app`).

### Deploying the Frontend on Railway

1. Add a new service in the same Railway project for your frontend (set root to `/` or your frontend directory).
2. Set the build command to `npm run build` and the output directory to `dist` (for Vite).
3. Update your frontend code to use the backend’s Railway URL for API calls.

---

## Backend Setup: YouTube-to-MP3 Downloads (Local Development)

If you want to run the backend locally (for development):

1. Install [yt-dlp](https://github.com/yt-dlp/yt-dlp/releases/latest) and [ffmpeg](https://www.gyan.dev/ffmpeg/builds/) on your system.
2. Update the paths in `server.js` to point to your local binaries if needed.
3. Run the backend as usual:
   ```sh
   cd backend
   npm install
   node server.js
   ```

---
