import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../App.css';
import Tonearm from './Tonearm';
import ReactPlayer from 'react-player';
import InputBox from './InputBox';
import Disk from './Disk';
import Toast from './Toast';

// Atmosphere Audio Assets
const forestAudio = '/assets/forest.mp3';
const rainfallAudio = '/assets/rainfall.mp3';
const whiteNoiseAudio = '/assets/white_noise.mp3';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { CapacitorMusicControls } from 'capacitor-music-controls-plugin';

const YOUTUBE_CONFIG = {
  youtube: {
    playerVars: { 
      autoplay: 1, 
      controls: 0, 
      modestbranding: 1,
      playsinline: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    }
  }
};

const sleepOptions = [
  { label: 'Off', value: null },
  { label: '5m', value: 5 * 60 },
  { label: '10m', value: 10 * 60 },
  { label: '15m', value: 15 * 60 },
  { label: '20m', value: 20 * 60 },
  { label: '30m', value: 30 * 60 },
  { label: '45m', value: 45 * 60 },
  { label: '1h', value: 60 * 60 },
  { label: '1.5h', value: 90 * 60 },
  { label: '2h', value: 120 * 60 },
  { label: '3h', value: 180 * 60 },
];

const SleepDial = ({ onSelect, onClose, isDarkBg }) => {
  const scrollRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleScroll = (e) => {
    const container = e.target;
    const itemHeight = 44; // match h-11
    const index = Math.round(container.scrollTop / itemHeight);
    if (index >= 0 && index < sleepOptions.length && index !== selectedIndex) {
      setSelectedIndex(index);
    }
  };

  useEffect(() => {
    // Initial scroll to current selection if possible, otherwise start at 0
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-4 rounded-3xl p-2 z-[200] w-[110px] backdrop-blur-3xl border bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)]"
    >
      <div className="relative h-[132px] w-full flex flex-col items-center overflow-hidden rounded-2xl">
        {/* Selection Highlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-11 border-y border-[#b88c5a]/30 pointer-events-none z-0" />
        
        {/* Top/Bottom Fade */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b z-20 pointer-events-none from-[#0d0d0d] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t z-20 pointer-events-none from-[#0d0d0d] to-transparent" />

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-10 py-11"
        >
          {sleepOptions.map((opt, i) => {
            const distance = Math.abs(i - selectedIndex);
            const opacity = distance === 0 ? 1 : distance === 1 ? 0.4 : 0;
            const scale = distance === 0 ? 1.2 : 0.85;
            const rotateX = (i - selectedIndex) * 35; // Circular warp effect
            const yOffset = (i - selectedIndex) * 5;

            return (
              <div
                key={i}
                className="h-11 flex items-center justify-center snap-center cursor-pointer"
                onClick={() => onSelect(opt.value)}
              >
                <motion.span 
                  animate={{ 
                    opacity, 
                    scale, 
                    rotateX,
                    y: yOffset,
                    color: distance === 0 ? '#ffffff' : 'rgba(255,255,255,0.3)'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="text-[14px] font-black tracking-tighter uppercase"
                >
                  {opt.label}
                </motion.span>
              </div>
            );
          })}
        </div>
      </div>
      
      <button 
        onClick={() => onSelect(sleepOptions[selectedIndex].value)}
        className="w-full py-2 mt-2 text-center text-[9px] font-black text-white/40 uppercase tracking-[0.2em] hover:bg-white/5 hover:text-white/60 rounded-xl transition-all"
      >
        Set Timer
      </button>
    </motion.div>
  );
};

export default function Play({
  queue = [],
  addVideoToQueue,
  currentVideoIndex,
  setCurrentVideoIndex,
  setQueue,
  played,
  setPlayed,
  isPlaying,
  setIsPlaying,
  setIsQueueOpen,
  favorites = [],
  setFavorites,
  playlists = [],
  setPlaylists,
  sidebarOpen,
  setSidebarOpen,
  isDarkBg,
  setIsDarkBg,
  autoBookmark = false,
  setAutoBookmark,
}) {
  const [newVideoLink, setNewVideoLink] = useState(''); // Input for new video link
  const [playbackRate, setPlaybackRate] = useState(1); // State to control playback speed
  const [playbackMode, setPlaybackMode] = useState('none'); // none | repeat-song | repeat-queue | shuffle
  const [activeTab, setActiveTab] = useState('controls'); // controls | playlists
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [toastConfig, setToastConfig] = useState(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [sleepTime, setSleepTime] = useState(null); // time remaining in seconds
  const [showSleepDial, setShowSleepDial] = useState(false);
  const [currentAmbient, setCurrentAmbient] = useState('none');
  const [isAmbientMenuOpen, setIsAmbientMenuOpen] = useState(false);
  const ambientAudioRef = useRef(new Audio());
  useEffect(() => {
    ambientAudioRef.current.volume = 0.75;
    ambientAudioRef.current.loop = true;
  }, []);
  const ambientUnlocked = useRef(false);
  const pendingSeekRef = useRef(null); // Used to ensure seek happens onReady

  const ambientSounds = {
    none: null,
    rain: rainfallAudio,
    white: whiteNoiseAudio,
    forest: forestAudio,
  };

  // 100% Native-Audio Unlocker: Unlocking the AudioContext on first touch
  useEffect(() => {
    const unlock = () => {
      if (ambientUnlocked.current) return;
      const audio = ambientAudioRef.current;
      audio.src = 'https://www.soundjay.com/button/beep-01.mp3'; // Tiny beep to wake up engine
      audio.volume = 0.01;
      audio.play().then(() => {
        audio.pause();
        ambientUnlocked.current = true;
      }).catch(e => console.log("Unlock failed, retrying on next touch"));
      
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('mousedown', unlock);
    };

    window.addEventListener('touchstart', unlock);
    window.addEventListener('mousedown', unlock);
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('mousedown', unlock);
    };
  }, []);

  const handleAmbientChange = (id) => {
    if (id === currentAmbient && id !== 'none') {
        setIsAmbientMenuOpen(false);
        return;
    }
    
    setCurrentAmbient(id);
    setIsAmbientMenuOpen(false);
    
    const audio = ambientAudioRef.current;
    if (id === 'none') {
      audio.pause();
      audio.src = '';
    } else if (ambientSounds[id]) {
      audio.pause();
      audio.src = ambientSounds[id];
      audio.load();
      audio.loop = true;
      audio.volume = 0.75; // Set to 75% as requested
      audio.muted = false;
      
      // Use a more resilient play sequence
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Ambient play deferred:", error);
          // Only retry once to avoid potential loops if the audio engine is busy
          setTimeout(() => {
            if (audio.paused) audio.play().catch(() => {});
          }, 500);
        });
      }
    }
  };
  const [hasStartedInteractive, setHasStartedInteractive] = useState(false); // Defers URL loading on startup
  const playerRef = useRef(null);
  const audioTagRef = useRef(null); // Dedicated local audio engine
  const lastProgressUpdate = useRef(0); // Throttle progress state updates
  const lastTrackRef = useRef('');
  const isCreatingControls = useRef(false);
  const actionHandlersRef = useRef({
    next: () => setCurrentVideoIndex((prev) => (prev + 1) % queue.length),
    prev: () => setCurrentVideoIndex((prev) => (prev === 0 ? queue.length - 1 : prev - 1)),
    toggle: () => setIsPlaying(prev => !prev)
  });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  // No YouTube API Key needed! Search is handled by the backend.
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyBepNVCKYHPahyaSSTpz-lPFo_n2khb5v8';

  const showToast = (message, type = 'success') => {
    setToastConfig({ message, type });
  };

  // Keep handlers fresh without re-triggering effects
  useEffect(() => {
    actionHandlersRef.current = {
        next: () => setCurrentVideoIndex((prev) => (prev + 1) % queue.length),
        prev: () => setCurrentVideoIndex((prev) => (prev === 0 ? queue.length - 1 : prev - 1)),
        toggle: () => setIsPlaying(prev => !prev)
    };
  }, [queue.length, setCurrentVideoIndex, setIsPlaying]);

  // Unlock audio/video autoplay once the user first clicks "Play"
  useEffect(() => {
    if (isPlaying) {
      setHasStartedInteractive(true);
    }
  }, [isPlaying]);

  const currentSong = queue[currentVideoIndex];
  const isLocalSong = currentSong?.isLocal || currentSong?.url?.startsWith('_capacitor_file_') || currentSong?.url?.startsWith('blob:') || currentSong?.url?.includes('/download?');

  // Explicit Audio Control for Background Playback
  useEffect(() => {
    if (!audioTagRef.current || !isLocalSong) return;
    
    if (isPlaying) {
      audioTagRef.current.play().catch(e => {
          console.warn("Audio tag play failed, likely needs gesture:", e);
      });
    } else {
      audioTagRef.current.pause();
    }
  }, [isPlaying, currentVideoIndex, isLocalSong, currentSong?.url]);

  // Sync Media Metadata - ONLY when the song actually changes (prevents audio hardware re-sync stutters)
  useEffect(() => {
    if ('mediaSession' in navigator && queue.length > 0 && currentSong) {
      const isYouTube = currentSong?.url?.includes('youtube.com') || currentSong?.url?.includes('youtu.be');
      const ytMatch = currentSong?.url?.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
      const thumbnail = (isYouTube && ytMatch)
        ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
        : 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=512&q=80'; // JPG Fallback

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong?.title || 'Pippofy Track',
        artist: `Pippofy • ${playbackMode === 'repeat-song' ? '🔂 Repeating Song' : playbackMode === 'repeat-queue' ? '🔁 Repeating Queue' : playbackMode === 'shuffle' ? '🔀 Shuffled' : '▶️ Sequential'}`,
        album: 'Vinyl Collection',
        artwork: [
          { src: thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      // Register handlers ONCE per track change
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => actionHandlersRef.current.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => actionHandlersRef.current.next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
          const time = details.seekTime;
          if (isLocalSong && audioTagRef.current && isFinite(time)) {
              audioTagRef.current.currentTime = time;
          } else if (playerRef.current && isFinite(time)) {
              playerRef.current.seekTo(time);
          }
      });
    }
  }, [currentVideoIndex, playbackMode, currentSong?.url]);

  // Sleep Timer countdown logic
  useEffect(() => {
    let interval;
    if (sleepTime > 0 && isPlaying) {
      interval = setInterval(() => {
        setSleepTime((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            showToast('Sleep timer finished. Playback stopped.');
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (sleepTime === 0) {
        setIsPlaying(false);
        setSleepTime(null);
    }
    return () => clearInterval(interval);
  }, [sleepTime, isPlaying, setIsPlaying]);

  // ── Auto-Bookmark: Save progress every 5s for YouTube videos ─────────────
  useEffect(() => {
    if (!autoBookmark || !isPlaying || isLocalSong) return;
    const url = currentSong?.url;
    if (!url) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        const ct = playerRef.current.getCurrentTime();
        if (isFinite(ct) && ct > 5) {
          Preferences.get({ key: 'bookmarks' }).then(({ value }) => {
            const bookmarks = value ? JSON.parse(value) : {};
            bookmarks[url] = Math.floor(ct);
            Preferences.set({ key: 'bookmarks', value: JSON.stringify(bookmarks) });
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoBookmark, isPlaying, isLocalSong, currentSong?.url]);

  // ── Auto-Bookmark: Restore saved position when song changes ──────────────
  const didRestoreRef = useRef('');
  useEffect(() => {
    if (!autoBookmark) return;
    const url = currentSong?.url;
    if (!url || isLocalSong || didRestoreRef.current === url) return;

    Preferences.get({ key: 'bookmarks' }).then(({ value }) => {
      if (!value) return;
      const bookmarks = JSON.parse(value);
      const savedSeconds = bookmarks[url];
      if (!savedSeconds || savedSeconds < 5) return;

      didRestoreRef.current = url;
      pendingSeekRef.current = savedSeconds; // Mark for seek onReady
    });
  }, [autoBookmark, currentVideoIndex, currentSong?.url, isLocalSong]);


  const formatSleepTime = (seconds) => {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  // Sync Playback State & Native Music Controls - Decoupled from Metadata for smoothness
  useEffect(() => {
    const syncNativeControls = async () => {
        if (queue.length > 0) {
            if ('mediaSession' in navigator) {
               navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
            }
            
            try {
                if (isCreatingControls.current) return;
                const currentUrl = currentSong?.url || '';
                const needsCreate = lastTrackRef.current !== currentUrl;

                if (needsCreate) {
                    isCreatingControls.current = true;
                    const isYouTube = currentUrl?.includes('youtube.com') || currentUrl?.includes('youtu.be');
                    const ytMatch = currentUrl?.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
                    const thumbnail = (isYouTube && ytMatch)
                        ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
                        : 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=512&q=80';

                    await CapacitorMusicControls.create({
                        track: currentSong?.title || 'Playing Music',
                        artist: 'Pippofy Audio Player',
                        album: 'Vinyl Collection',
                        cover: thumbnail,
                        isPlaying: isPlaying,
                        dismissable: false,
                        hasPrev: true,
                        hasNext: true,
                        hasClose: false,
                        ticker: `Now playing ${currentSong?.title || 'Music'}`,
                        // Missing fields that cause crashes in some Android plugin versions
                        playIcon: '',
                        pauseIcon: '',
                        prevIcon: '',
                        nextIcon: '',
                        closeIcon: '',
                        notificationIcon: ''
                    });
                    lastTrackRef.current = currentUrl;
                } else {
                    await CapacitorMusicControls.updateIsPlaying({ isPlaying });
                }
            } catch (e) {
                console.error("Music Controls error:", e);
            } finally {
                isCreatingControls.current = false;
            }
        }
    };
    syncNativeControls();
  }, [isPlaying, currentVideoIndex, currentSong?.url]);

  useEffect(() => {
    const handleControlsEvent = (event) => {
        const message = event.message || event.action;
        if (message === 'music-controls-next') actionHandlersRef.current.next();
        else if (message === 'music-controls-previous') actionHandlersRef.current.prev();
        else if (message === 'music-controls-pause') setIsPlaying(false);
        else if (message === 'music-controls-play') setIsPlaying(true);
    };
    
    document.addEventListener("controlsNotification", handleControlsEvent);
    return () => document.removeEventListener("controlsNotification", handleControlsEvent);
  }, []);



  // Navbar Event Listener
  useEffect(() => {
    const handlePick = () => fileInputRef.current?.click();
    window.addEventListener('open-file-pick', handlePick);
    return () => window.removeEventListener('open-file-pick', handlePick);
  }, []);

  // Metadata Heartbeat (Atomic Updates) - DELETED
  // Action Handlers and Metadata are now managed in a focused useEffect above
  // to prevent re-registration spikes during play/pause toggles.
  // NOTE: Local audio progress is tracked via onTimeUpdate on the <audio> element below.
  // Removed the duplicate 1-second setInterval that was competing with onTimeUpdate and
  // causing double re-renders, which manifested as audio jitter/lag.

  useEffect(() => {
    if (queue.length > 0) {
      // Determine if the new current song is local
      const newSong = queue[currentVideoIndex];
      const newIsLocal = newSong?.isLocal || newSong?.url?.startsWith('_capacitor_file_') || newSong?.url?.startsWith('blob:');

      if (newIsLocal) {
        if (audioTagRef.current && audioTagRef.current.src !== newSong.url) {
          audioTagRef.current.src = newSong.url;
        }
      } else {
        // Stop local audio engine before starting YouTube
        if (audioTagRef.current && audioTagRef.current.src) {
          audioTagRef.current.pause();
          audioTagRef.current.removeAttribute('src');
          audioTagRef.current.load();
        }
      }
    }
  }, [queue.length, currentVideoIndex]);

  // Robust Local Audio Engine Controller
  useEffect(() => {
    const audio = audioTagRef.current;
    if (!audio) return;

    if (isLocalSong) {
      if (isPlaying) {
        // Use a small delay for local blob files to ensure the hardware is ready
        const playTimeout = setTimeout(() => {
          if (audio.paused && isPlaying) {
            audio.play().catch(e => console.warn("Audio play blocked", e));
          }
        }, 150);
        return () => clearTimeout(playTimeout);
      } else {
        if (!audio.paused) audio.pause();
      }
    } else {
      // YouTube mode or idle: Stop local engine completely
      if (!audio.paused) audio.pause();
      if (audio.src) {
        audio.src = '';
        audio.load();
      }
    }
  }, [isPlaying, isLocalSong, currentSong?.url]);


  const extractVideoId = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/.*v=|youtu\.be\/)([^&\s]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const extractPlaylistId = (url) => {
    const regex = /[?&]list=([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const searchYouTube = async (query) => {
    try {
      // Use our backend search instead of YouTube API!
      const response = await fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data && data.videoId) {
        return data.videoId;
      }
    } catch (error) {
      console.error('Error searching YouTube on backend:', error);
    }
    return null;
  };

  // ── Helper: add Spotify track search queries to queue as stream tracks ──
  const addSpotifyTracksToQueue = async (tracks, labelPrefix = '') => {
    if (!tracks || tracks.length === 0) {
      showToast('No tracks found', 'error');
      return;
    }
    showToast(`Found ${tracks.length} tracks. Syncing...`, 'info');
    let addedCount = 0;
    for (const trackQuery of tracks) {
      const videoId = await searchYouTube(trackQuery);
      if (videoId) {
        const streamUrl = `${BACKEND_URL}/download?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
        setQueue((prevQueue) => {
          const alreadyExists = prevQueue.some(q => q.title === trackQuery);
          if (alreadyExists) return prevQueue;
          if (prevQueue.length === 0) {
            setCurrentVideoIndex(0);
            setIsPlaying(true);
          }
          return [...prevQueue, {
            url: streamUrl,
            title: trackQuery,
            isLocal: true, // native audio tag = background playback works
            originalUrl: `https://www.youtube.com/watch?v=${videoId}`
          }];
        });
        addedCount++;
      }
    }
    showToast(`${labelPrefix}Synced ${addedCount} track${addedCount !== 1 ? 's' : ''}!`, 'success');
  };

  const handleSpotifyLink = async (rawUrl) => {
    const url = rawUrl.trim();
    try {
      // ── Spotify Playlist ────────────────────────────────────────────────
      if (url.includes('/playlist/')) {
        showToast('Scanning Spotify Playlist...', 'info');
        const response = await fetch(`${BACKEND_URL}/spotify-playlist?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`Playlist scan failed: ${response.status}`);
        const { tracks } = await response.json();
        await addSpotifyTracksToQueue(tracks, 'Playlist ');
        return;
      }

      // ── Spotify Album ───────────────────────────────────────────────────
      if (url.includes('/album/')) {
        showToast('Scanning Spotify Album...', 'info');
        const response = await fetch(`${BACKEND_URL}/spotify-album?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`Album scan failed: ${response.status}`);
        const { tracks } = await response.json();
        await addSpotifyTracksToQueue(tracks, 'Album ');
        return;
      }

      // ── Single Spotify Track ────────────────────────────────────────────
      // Always go through backend to avoid CORS on mobile/Android
      showToast('Identifying Spotify track...', 'info');
      const response = await fetch(`${BACKEND_URL}/spotify-track?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error(`Track resolution failed: ${response.status}`);
      const data = await response.json();

      if (data && data.searchQuery) {
        const videoId = await searchYouTube(data.searchQuery);
        if (videoId) {
          const streamUrl = `${BACKEND_URL}/download?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
          const finalTitle = data.title || data.searchQuery;
          setQueue((prevQueue) => {
            const alreadyExists = prevQueue.some(q => q.title === finalTitle);
            if (alreadyExists) return prevQueue;
            if (prevQueue.length === 0) {
              setCurrentVideoIndex(0);
              setIsPlaying(true);
            }
            return [...prevQueue, {
              url: streamUrl,
              title: finalTitle,
              isLocal: true, 
              originalUrl: `https://www.youtube.com/watch?v=${videoId}`
            }];
          });
          showToast(`"${finalTitle}" added!`, 'success');
        } else {
          showToast('No YouTube match found for this song', 'error');
        }
      } else {
        showToast('Could not identify Spotify track', 'error');
      }
    } catch (error) {
      console.error('Spotify error:', error);
      showToast(`Spotify error: ${error.message}`, 'error');
    }
  };

  const fetchPlaylistVideos = async (playlistId) => {
    const apiKey = 'AIzaSyBepNVCKYHPahyaSSTpz-lPFo_n2khb5v8'; // Replace with your YouTube Data API key
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`;

    let allVideos = [];
    let nextPageToken = '';

    try {
      do {
        const response = await fetch(`${apiUrl}&pageToken=${nextPageToken}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          const videos = data.items.map((item) => ({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
          }));
          allVideos = [...allVideos, ...videos];
        }

        nextPageToken = data.nextPageToken || ''; // Update the nextPageToken
      } while (nextPageToken); // Continue fetching if there is a nextPageToken
    } catch (error) {
      console.error('Error fetching playlist videos:', error);
    }

    return allVideos;
  };

  const handleAddVideo = async () => {
    const link = newVideoLink.trim();
    if (link === '') {
      showToast('Please enter a link', 'error');
      return;
    }

    setNewVideoLink(''); // Clear immediately for better UX

    // 1. Spotify Handling (Playlist or Song)
    if (link.toLowerCase().includes('spotify.com') || link.toLowerCase().includes('spotify.link')) {
      await handleSpotifyLink(link);
      return;
    }

    // 2. YouTube Playlist Handling
    if (link.includes('list=')) {
      const playlistId = extractPlaylistId(link);
      if (playlistId) {
        showToast('Fetching YouTube Playlist...', 'info');
        const videos = await fetchPlaylistVideos(playlistId);
        if (videos.length > 0) {
          const updatedQueue = videos.map((video) => ({
            url: `https://www.youtube.com/watch?v=${video.videoId}`,
            title: video.title,
          }));
          setQueue((prevQueue) => {
            if (prevQueue.length === 0) setIsPlaying(true);
            return [...prevQueue, ...updatedQueue];
          });
          showToast(`Added ${videos.length} videos from playlist`, 'success');
        } else {
          showToast('No videos found in playlist', 'error');
        }
      } else {
        showToast('Invalid YouTube playlist link', 'error');
      }
      return;
    }

    // 3. Single YouTube Video Handling
    const videoId = extractVideoId(link);
    if (videoId) {
      showToast('Adding video...', 'info');
      // No extra API call needed for titles anymore if we trust the user link, 
      // but let's keep the fallback videoTitle if it was available.
      setQueue((prevQueue) => {
        if (prevQueue.length === 0) setIsPlaying(true);
        return [...prevQueue, { url: link, title: 'YouTube Audio' }];
      });
      showToast('Video added to queue!', 'success');
    } else {
      showToast('Invalid video or song link', 'error');
    }
  };

  const handleClearQueue = () => {
    setQueue([]); // Clear the queue
    setIsPlaying(false); // Stop playback
    setCurrentVideoIndex(0); // Reset the current video index
  };

  const handleSeek = (progress) => {
    if (!isFinite(progress)) return;
    setPlayed(progress);
    if (isLocalSong && audioTagRef.current) {
        const dur = audioTagRef.current.duration;
        if (isFinite(dur) && dur > 0) {
            audioTagRef.current.currentTime = progress * dur;
        }
    } else if (playerRef.current) {
        playerRef.current.seekTo(progress, 'fraction');
    }
  };

  const handleScratch = (velocity) => {
    if (!isLocalSong || !audioTagRef.current) return;
    
    if (velocity === null) {
      audioTagRef.current.playbackRate = playbackRate;
      audioTagRef.current.muted = false;
      return;
    }

    // Map velocity to playback rate with a more natural curves
    // A raw 1:1 mapping often sounds "robotic".
    const absV = Math.abs(velocity);
    
    // If dragging very slowly, we mute to avoid "granularity" or digital clicking
    if (absV < 0.15) {
      audioTagRef.current.muted = true;
      return;
    }

    // Exponentially clamp the rate for a more "elastic" vinyl feel
    const targetRate = Math.min(Math.max(absV, 0.2), 3.0);
    audioTagRef.current.playbackRate = targetRate;
    audioTagRef.current.muted = false;
  };

  const handleSkipBackward = () => {
    if (isLocalSong && audioTagRef.current) {
        const ct = audioTagRef.current.currentTime || 0;
        audioTagRef.current.currentTime = Math.max(ct - 10, 0);
    } else if (playerRef.current) {
        const ct = playerRef.current.getCurrentTime() || 0;
        if (isFinite(ct)) {
            playerRef.current.seekTo(Math.max(ct - 10, 0), 'seconds');
        }
    }
  };

  const handleSkipForward = () => {
    if (isLocalSong && audioTagRef.current) {
        const ct = audioTagRef.current.currentTime || 0;
        const dur = audioTagRef.current.duration || 0;
        audioTagRef.current.currentTime = Math.min(ct + 10, dur);
    } else if (playerRef.current) {
        const ct = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        if (isFinite(ct) && isFinite(dur)) {
            playerRef.current.seekTo(Math.min(ct + 10, dur), 'seconds');
        }
    }
  };

  useEffect(() => {
    if (audioTagRef.current) {
        audioTagRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const toggleFavorite = (song) => {
    const isFav = favorites.some(f => f.url === song.url);
    if (isFav) {
      setFavorites(favorites.filter(f => f.url !== song.url));
    } else {
      setFavorites([...favorites, song]);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newSongs = [];
      
      for (const file of files) {
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            try {
              const base64Data = reader.result.split(',')[1];
              const uniqueFileName = `${Date.now()}_${file.name}`;
              
              await Filesystem.writeFile({
                path: uniqueFileName,
                data: base64Data,
                directory: Directory.Data
              });
              
              const fileUri = await Filesystem.getUri({
                path: uniqueFileName,
                directory: Directory.Data
              });

              newSongs.push({
                url: Capacitor.convertFileSrc(fileUri.uri),
                title: file.name.replace(/\.[^/.]+$/, ""),
                isLocal: true,
                isLive: true
              });
            } catch (err) {
              console.error("Error saving local audio file:", err);
            }
            resolve();
          };
          reader.onerror = () => resolve();
        });
      }

      if (newSongs.length > 0) {
        setQueue(prev => {
          const updatedQueue = [...prev, ...newSongs];
          if (prev.length === 0) {
            setCurrentVideoIndex(0);
            setIsPlaying(true);
          }
          return updatedQueue;
        });
      }
    }
    e.target.value = '';
  };

  const handleScanSystemMusic = async () => {
    try {
      // Folders to check on Android/iOS
      const commonFolders = ['Music', 'Download', 'Documents'];
      let foundSongs = [];

      for (const folder of commonFolders) {
        try {
          const result = await Filesystem.readdir({
            path: folder,
            directory: Directory.ExternalStorage
          });

          const audioFiles = result.files.filter(f => 
            f.name.match(/\.(mp3|wav|m4a|flac|ogg)$/i)
          );

          for (const file of audioFiles) {
            const { uri } = await Filesystem.getUri({
              path: `${folder}/${file.name}`,
              directory: Directory.ExternalStorage
            });
            
            foundSongs.push({
              url: Capacitor.convertFileSrc(uri),
              title: file.name.replace(/\.[^/.]+$/, ""),
              isLocal: true,
              isLive: true
            });
          }
        } catch (e) {
          console.warn(`Could not read ${folder}:`, e);
        }
      }

      if (foundSongs.length > 0) {
        setQueue(prev => {
          // Prevent duplicates by checking URL
          const existingUrls = new Set(prev.map(s => s.url));
          const uniqueNewSongs = foundSongs.filter(s => !existingUrls.has(s.url));
          return [...prev, ...uniqueNewSongs];
        });
        setToastConfig({ message: `Successfully added ${foundSongs.length} local tracks!`, type: 'success' });
      } else {
        setToastConfig({ message: 'No music files found in standard folders.', type: 'error' });
      }
    } catch (err) {
      setToastConfig({ message: 'Permission denied or issue accessing storage.', type: 'error' });
      console.error(err);
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      setShowCreateInput(false);
      return;
    }
    const newPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      songs: []
    };
    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setShowCreateInput(false);
  };

  const handleRenamePlaylist = (id, newName) => {
    setPlaylists(playlists.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleDeletePlaylist = (id) => {
    setPlaylists(playlists.filter(p => p.id !== id));
  };

  const handleAddSongToPlaylist = (playlistId, song) => {
    if (!song) {
      setToastConfig({ message: 'No song currently playing to add!', type: 'error' });
      return;
    }
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        // Prevent duplicate songs in playlist
        if (p.songs.some(s => s.url === song.url)) return p;
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    }));
    setShowPlaylistPicker(false);
    setToastConfig({ message: 'Added to playlist!', type: 'success' });
  };

  const handleRemoveSongFromPlaylist = (playlistId, songUrl) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.url !== songUrl) };
      }
      return p;
    }));
  };

  const handlePlayPlaylist = (playlist) => {
    if (playlist.songs.length === 0) {
      setToastConfig({ message: 'This playlist is empty!', type: 'error' });
      return;
    }
    setQueue(playlist.songs);
    setCurrentVideoIndex(0);
    setIsPlaying(true);
    setSidebarOpen(false);
  };

  const handleSharePlaylist = async (playlist) => {
    const shareData = {
      title: `Pippofy Playlist: ${playlist.name}`,
      text: `Check out my playlist on Pippofy!\n\n${playlist.name} (${playlist.songs.length} songs)`,
      url: window.location.href // In a real app, this would be a deep link with the playlist data encoded
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        const playlistString = JSON.stringify(playlist);
        await navigator.clipboard.writeText(playlistString);
        setToastConfig({ message: 'Playlist data copied to clipboard!', type: 'success' });
      }
    } catch (err) {
      console.error('Sharing failed:', err);
    }
  };

  const fileInputRef = useRef(null);

  // Responsive: show only disk and input on mobile, controls in sidebar
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

  // Controls panel (to be reused in sidebar or main)
  // ControlsPanel for reuse
  const ControlsPanel = (
    <>
      {/* Row 1: Play / Stop */}
      <button
        className="group focus:outline-none active:scale-90 transition-all duration-200"
        onClick={() => setIsPlaying(!isPlaying)}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        <div className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors duration-200 ${
          isPlaying
            ? 'bg-white/10 text-white'
            : 'bg-white/[0.04] text-white/55 group-hover:bg-white/10 group-hover:text-white'
        }`}>
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="5" y="4" width="4" height="16" rx="1.5" />
              <rect x="15" y="4" width="4" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </div>
      </button>

      {/* Row 1: Playback Mode (Sequential -> Repeat Song -> Repeat Queue -> Shuffle) */}
      <button
        className="group focus:outline-none active:scale-90 transition-all duration-200"
        onClick={() => {
          const modes = ['none', 'repeat-song', 'repeat-queue', 'shuffle'];
          const nextIndex = (modes.indexOf(playbackMode) + 1) % modes.length;
          setPlaybackMode(modes[nextIndex]);
          showToast(`Mode: ${modes[nextIndex].replace('-', ' ').toUpperCase()}`);
        }}
        title={`Playback Mode: ${playbackMode.replace('-', ' ')}`}
      >
        <div className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors duration-200 ${
          playbackMode !== 'none'
            ? 'text-[#b88c5a] bg-[#b88c5a]/10'
            : 'text-white/28 bg-white/[0.03] group-hover:text-white/65 group-hover:bg-white/[0.07]'
        }`}>
          {playbackMode === 'shuffle' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          ) : playbackMode === 'repeat-song' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /><text x="12" y="15" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">1</text>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          )}
        </div>
      </button>

      {/* Row 2: Back */}
      <button
        className="group focus:outline-none active:scale-90 transition-all duration-200"
        onClick={() => setCurrentVideoIndex((prev) => (prev === 0 ? queue.length - 1 : prev - 1))}
        title="Previous"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full text-white/28 bg-white/[0.03] transition-colors duration-200 group-hover:text-white/70 group-hover:bg-white/[0.07]">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="19,4 8,12 19,20" />
            <rect x="5" y="4" width="3" height="16" rx="1" />
          </svg>
        </div>
      </button>

      {/* Row 2: Next */}
      <button
        className="group focus:outline-none active:scale-90 transition-all duration-200"
        onClick={() => { if (queue.length > 0) setCurrentVideoIndex((prev) => (prev + 1) % queue.length); }}
        title="Next"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full text-white/28 bg-white/[0.03] transition-colors duration-200 group-hover:text-white/70 group-hover:bg-white/[0.07]">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="5,4 16,12 5,20" />
            <rect x="16" y="4" width="3" height="16" rx="1" />
          </svg>
        </div>
      </button>

      {/* Row 3: Add to Playlist */}
      <button
        className="group focus:outline-none active:scale-90 transition-all duration-200"
        onClick={() => setShowPlaylistPicker(true)}
        title="Add to Playlist"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full text-white/28 bg-white/[0.03] transition-colors duration-200 group-hover:text-[#b88c5a] group-hover:bg-[#b88c5a]/8">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </button>
      {/* Row 3: Favorite */}
      <button
        className="group focus:outline-none active:scale-90 transition-all duration-200"
        onClick={() => { if (queue[currentVideoIndex]) toggleFavorite(queue[currentVideoIndex]); }}
        title={favorites.some(f => f.url === queue[currentVideoIndex]?.url) ? 'Remove from Favorites' : 'Add to Favorites'}
      >
        <div className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors duration-200 ${
          favorites.some(f => f.url === queue[currentVideoIndex]?.url)
            ? 'text-red-400 bg-red-500/10'
            : 'text-white/28 bg-white/[0.03] group-hover:text-red-400/65 group-hover:bg-red-500/6'
        }`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={favorites.some(f => f.url === queue[currentVideoIndex]?.url) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
      </button>

      {/* Row 4: Upload From Device */}
      <button
        className="group focus:outline-none active:scale-90 transition-all duration-200"
        onClick={() => fileInputRef.current.click()}
        title="Play From Device"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full text-white/28 bg-white/[0.03] transition-colors duration-200 group-hover:text-white/70 group-hover:bg-white/[0.07]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" multiple className="hidden" />
      </button>

      {/* Row 4: Speed */}
      <div className="relative" title="Playback Speed">
        <button
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors duration-200 active:scale-90 outline-none ${
            showSpeedMenu || playbackRate !== 1
              ? 'text-[#b88c5a] bg-[#b88c5a]/10'
              : 'text-white/28 bg-white/[0.03] hover:text-white/70 hover:bg-white/[0.07]'
          }`}
        >
          <span className="text-[13px] font-black tracking-tight">{playbackRate}x</span>
        </button>

        {/* Custom Premium Speed Menu */}
        {showSpeedMenu && (
          <div className={`absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[130px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden z-50 flex flex-col py-1.5 ${isDarkBg ? 'bg-[#111]/98 border border-white/8' : 'bg-black/60 border border-white/15'}`}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <button
                key={speed}
                className={`py-2 px-4 w-full text-left flex justify-between items-center text-[13px] transition-colors ${playbackRate === speed ? 'text-[#b88c5a] font-bold' : 'text-white/55 hover:text-white/90 font-medium'}`}
                onClick={() => { setPlaybackRate(speed); setShowSpeedMenu(false); }}
              >
                <span>{speed}x</span>
                {playbackRate === speed && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#b88c5a]"><polyline points="20 6 9 17 4 12"></polyline></svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const PlaylistsView = (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {!selectedPlaylistId ? (
        <>
          <div className="flex flex-col gap-4 mb-8 w-full px-1">
            {/* Search Bar - Elite Design */}
            <div className="relative w-full group">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a Playlist..."
                className={`w-full rounded-2xl px-10 py-3 text-sm focus:outline-none focus:border-[#b88c5a]/50 transition-all shadow-inner border text-white ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10' : 'bg-black/40 border-white/20'}`}
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#b88c5a] transition-colors text-white/20" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>

            {/* Create Flow */}
            {showCreateInput ? (
              <div className="flex flex-col gap-2 animate-slide-in">
                <input 
                  autoFocus
                  type="text" 
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreatePlaylist();
                    }
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setShowCreateInput(false);
                    }
                  }}
                  onBlur={() => {
                    if (!newPlaylistName.trim()) setShowCreateInput(false);
                  }}
                  placeholder="Playlist name..."
                  className="w-full bg-[#b88c5a]/10 border border-[#b88c5a]/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#b88c5a] transition-all"
                />
                <p className="text-[8px] text-white/30 uppercase tracking-widest text-center">Press Enter to save</p>
              </div>
            ) : (
              <button 
                onClick={() => setShowCreateInput(true)}
                className="w-full py-3 rounded-2xl text-[10px] font-bold active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:bg-[#b88c5a] hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Create Playlist
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-4 pb-20">
            {playlists.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <p className="text-center text-xs italic mt-10 text-white/30">
                {searchQuery ? "No matching playlists found" : "No playlists yet. Create one above!"}
              </p>
            ) : (
              playlists
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((playlist) => (
                <div key={playlist.id} className="border rounded-xl p-4 flex flex-col gap-3 group transition-all bg-white/5 border-white/10 hover:bg-white/[0.08]">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      {editingPlaylistId === playlist.id ? (
                        <input 
                          autoFocus
                          type="text"
                          defaultValue={playlist.name}
                          onBlur={(e) => {
                            handleRenamePlaylist(playlist.id, e.target.value);
                            setEditingPlaylistId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenamePlaylist(playlist.id, e.target.value);
                              setEditingPlaylistId(null);
                            }
                          }}
                          className="bg-black/20 text-white font-bold text-sm w-full focus:outline-none border-b border-[#b88c5a]"
                        />
                      ) : (
                        <span className="font-bold text-sm block cursor-default text-white" onClick={() => setSelectedPlaylistId(playlist.id)}>
                          {playlist.name}
                        </span>
                      )}
                      <p className="text-[10px] uppercase tracking-widest mt-1 text-white/30">{playlist.songs.length} Tracks</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleDeletePlaylist(playlist.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-white/30 hover:text-red-500 transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePlayPlaylist(playlist)}
                      className="w-full py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-3 bg-white/[0.05] hover:bg-[#b88c5a] text-white"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"></path></svg>
                      Play Collection
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full rounded-2xl p-4 bg-white/[0.02]">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => setSelectedPlaylistId(null)}
              className="flex items-center gap-2 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest group transition-all"
            >
              <svg className="group-hover:-translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingPlaylistId(editingPlaylistId === selectedPlaylistId ? null : selectedPlaylistId)}
                className={`p-2 rounded-lg transition-all ${editingPlaylistId === selectedPlaylistId ? 'bg-[#b88c5a] text-white hover:bg-[#a67c50]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                title={editingPlaylistId === selectedPlaylistId ? "Done Editing" : "Edit Playlist"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button 
                onClick={() => handleAddSongToPlaylist(selectedPlaylistId, queue[currentVideoIndex])}
                className="bg-white/10 text-white p-2 rounded-lg hover:bg-[#b88c5a] transition-all"
                title="Add current"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button 
                onClick={() => handlePlayPlaylist(playlists.find(p => p.id === selectedPlaylistId))}
                className="bg-[#b88c5a] text-white p-2 rounded-lg hover:scale-105 active:scale-95 transition-transform"
                title="Play All"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"></path></svg>
              </button>
            </div>
          </div>
          
          <div className="mb-6 px-1">
            {editingPlaylistId === selectedPlaylistId ? (
              <input 
                autoFocus
                type="text"
                defaultValue={playlists.find(p => p.id === selectedPlaylistId)?.name}
                onBlur={(e) => {
                  handleRenamePlaylist(selectedPlaylistId, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenamePlaylist(selectedPlaylistId, e.target.value);
                    setEditingPlaylistId(null);
                  }
                }}
                className="bg-black/20 text-[#b88c5a] font-bold text-xl w-full focus:outline-none border-b border-[#b88c5a]"
              />
            ) : (
              <h3 className="text-[#b88c5a] font-bold text-2xl truncate">
                {playlists.find(p => p.id === selectedPlaylistId)?.name}
              </h3>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-2">
            {playlists.find(p => p.id === selectedPlaylistId)?.songs.length === 0 ? (
              <p className="text-white/20 text-center text-xs italic py-10">This playlist is empty.</p>
            ) : (
              playlists.find(p => p.id === selectedPlaylistId)?.songs.map((song, idx) => {
                const isFav = favorites.some(f => f.url === song.url);
                return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 group ${editingPlaylistId === selectedPlaylistId ? 'cursor-default' : 'cursor-pointer'}`}
                  onClick={() => {
                     if (editingPlaylistId === selectedPlaylistId) return; // Prevent playback when in edit mode

                     const pl = playlists.find(p => p.id === selectedPlaylistId);
                     if (pl) {
                       setQueue(pl.songs);
                       setCurrentVideoIndex(idx);
                       setIsPlaying(true);
                       setSidebarOpen(false);
                     }
                  }}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`text-white text-xs font-medium truncate transition-colors ${editingPlaylistId === selectedPlaylistId ? '' : 'group-hover:text-[#b88c5a]'}`}>{song.title}</p>
                    <p className="text-white/30 text-[10px] uppercase tracking-tighter mt-0.5">{song.isLocal ? 'Local Audio' : 'YouTube'}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0">
                    {editingPlaylistId !== selectedPlaylistId && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(song);
                        }}
                        className={`p-2 rounded-lg transition-all ${isFav ? 'text-red-500 hover:bg-red-500/10' : 'text-white/20 hover:text-white hover:bg-white/10'}`}
                        title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                      </button>
                    )}
                    {editingPlaylistId === selectedPlaylistId && (
                      <button 
                        onPointerDown={(e) => {
                          e.preventDefault(); // Prevents input from losing focus!
                          e.stopPropagation();
                          handleRemoveSongFromPlaylist(selectedPlaylistId, song.url);
                        }}
                        className="text-white/30 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Remove from playlist"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                </div>
              )})
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-transparent">
      <Toast 
        message={toastConfig?.message} 
        type={toastConfig?.type} 
        onClose={() => setToastConfig(null)} 
      />

      {/* =========================================================
          SHARED: Playlist Picker Popup (works on both platforms)
      ========================================================= */}
      {showPlaylistPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-xl" onClick={() => setShowPlaylistPicker(false)} />
          <div className="relative w-full max-w-sm bg-[#0d0d0d]/98 backdrop-blur-3xl rounded-[36px] border border-white/10 p-7 shadow-[0_40px_100px_rgba(0,0,0,0.95)] transform transition-all overflow-hidden">
            {/* Background Polish */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#b88c5a]/40 to-transparent" />
            
            <h3 className="text-white/90 font-bold text-lg mb-8 flex justify-between items-center tracking-wide">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#b88c5a]/10 flex items-center justify-center border border-[#b88c5a]/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b88c5a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <span className="uppercase tracking-[0.1em] text-sm font-black">Add to Playlist</span>
              </div>
              <button onClick={() => setShowPlaylistPicker(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </h3>
            
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 scrollbar-hide py-1">
              {playlists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white/[0.02] rounded-3xl border border-white/5 border-dashed">
                   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-white/10"><path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 12H3M16 6H3M12 18H3"/></svg>
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">No playlists found</p>
                </div>
              ) : (
                playlists.map(p => (
                  <button key={p.id} onClick={() => handleAddSongToPlaylist(p.id, queue[currentVideoIndex])}
                    className="w-full flex items-center justify-between bg-white/[0.03] hover:bg-[#b88c5a]/10 p-5 rounded-2xl border border-white/5 hover:border-[#b88c5a]/30 transition-all group active:scale-[0.98]">
                    <div className="flex flex-col items-start">
                      <span className="text-white/90 group-hover:text-white font-bold text-sm tracking-wide">{p.name}</span>
                      <span className="text-white/20 text-[9px] uppercase font-black tracking-widest mt-1">{p.songs?.length || 0} Tracks</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-[#b88c5a]/20 flex items-center justify-center transition-all border border-transparent group-hover:border-[#b88c5a]/30">
                      <svg className="text-white/20 group-hover:text-[#b88c5a]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </button>
                ))
              )}
            </div>

            <button onClick={() => { setShowPlaylistPicker(false); setActiveTab('playlists'); setSidebarOpen(true); }}
              className="w-full mt-8 py-5 rounded-2xl bg-gradient-to-br from-[#b88c5a]/20 to-[#a67c4a]/5 hover:from-[#b88c5a]/30 hover:to-[#b88c5a]/15 border border-[#b88c5a]/20 text-white/80 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-[0.98] shadow-2xl">
              Create New Playlist
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MOBILE LAYOUT (hidden on lg+): Original perfect layout
      ========================================================= */}
      <div className="flex lg:hidden flex-col items-center justify-center h-full w-full pt-16 pb-20 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        <div 
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Mobile Sidebar Panel */}
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} fixed top-0 right-0 h-full w-[280px] sm:w-[320px] z-[110] p-5 sm:p-8 flex flex-col bg-[#0d0d0d]/98 backdrop-blur-3xl shadow-[-20px_0_100px_rgba(0,0,0,0.95)] border-l border-white/10`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* Sleep Timer */}
              <div className="relative">
                <button 
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl transition-all duration-500 active:scale-95 border ${sleepTime ? (isDarkBg ? 'bg-[#0d0d0d]/98 border-[#b88c5a]/40 text-[#b88c5a]' : 'bg-black/40 border-[#b88c5a]/40 text-[#b88c5a]') : (isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 text-white/30 hover:bg-white/5' : 'bg-black/40 backdrop-blur-3xl border-white/20 text-white/30 hover:bg-white/10')}`}
                  onClick={() => setShowSleepDial(!showSleepDial)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={sleepTime ? 'rotate-[-10deg] transition-transform' : ''}>
                    <line x1="10" x2="14" y1="2" y2="2" />
                    <line x1="12" x2="15" y1="13" y2="10" />
                    <circle cx="12" cy="14" r="8" />
                    <line x1="2" x2="5" y1="9" y2="9" opacity="0.6" />
                    <line x1="2" x2="5" y1="13" y2="13" />
                    <line x1="2" x2="5" y1="17" y2="17" opacity="0.6" />
                  </svg>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${sleepTime ? 'text-[#b88c5a]' : 'text-white/40'}`}>
                    {sleepTime ? formatSleepTime(sleepTime) : "Timer"}
                  </span>
                </button>
                
                <AnimatePresence>
                  {showSleepDial && (
                    <SleepDial 
                      onSelect={(val) => { setSleepTime(val); setShowSleepDial(false); }} 
                      onClose={() => setShowSleepDial(false)} 
                      isDarkBg={isDarkBg}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Settings Toggle icon only */}
              <button
                onClick={() => setActiveTab('settings')}
                title="Settings"
                className={`flex items-center justify-center p-2.5 rounded-2xl transition-all duration-300 active:scale-95 border ${
                  activeTab === 'settings'
                    ? (isDarkBg ? 'bg-white/10 border-white/20 text-white shadow-[0_4px_15px_rgba(0,0,0,0.5)]' : 'bg-[#b88c5a]/10 border-[#b88c5a]/30 text-[#b88c5a]')
                    : (isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 text-white/30 hover:bg-white/5' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10')
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>

              {/* About / Features icon */}
              <button
                onClick={() => setActiveTab('about')}
                title="Know More / Features"
                className={`flex items-center justify-center p-2.5 rounded-2xl transition-all duration-300 active:scale-95 border ${
                  activeTab === 'about'
                    ? (isDarkBg ? 'bg-white/10 border-white/20 text-white shadow-[0_4px_15px_rgba(0,0,0,0.5)]' : 'bg-[#b88c5a]/10 border-[#b88c5a]/30 text-[#b88c5a]')
                    : (isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 text-white/30 hover:bg-white/5' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10')
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                </svg>
              </button>
            </div>

          </div>
            <div className="flex w-full mb-8 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
              <button onClick={() => setActiveTab('controls')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'controls' ? 'bg-[#b88c5a] text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}>Controls</button>
              <button onClick={() => setActiveTab('playlists')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'playlists' ? 'bg-[#b88c5a] text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}>Playlists</button>
            </div>
            
            {activeTab === 'settings' && (
              <div className="flex-1 w-full overflow-y-auto scrollbar-hide px-1">
                <header className="mb-6 text-center mt-2">
                  <h2 className="text-white font-medium text-xs tracking-[0.2em] uppercase mb-1">App Settings</h2>
                  <div className="h-0.5 w-6 bg-[#b88c5a] mx-auto rounded-full" />
                </header>
                
                <div className="space-y-4">
                  {/* Auto-Resume Bookmark */}
                  <div className={`p-4 rounded-[22px] border ${isDarkBg ? 'bg-white/[0.02] border-white/5' : 'bg-black/5 border-white/10'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-xl bg-[#b88c5a]/10 flex items-center justify-center text-[#b88c5a]">
                           <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                         </div>
                         <div>
                           <p className="text-white font-bold text-xs">Auto-Resume</p>
                           <p className="text-white/20 text-[8px] uppercase font-black mt-0.5 tracking-tighter">Saves Progress</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => setAutoBookmark(!autoBookmark)}
                        className={`w-10 h-5 rounded-full transition-all duration-300 relative ${autoBookmark ? 'bg-[#b88c5a]' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${autoBookmark ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <p className="text-white/30 text-[9px] leading-relaxed">
                      Automatically remember where you left off in YouTube videos. Perfect for podcasts and long lectures.
                    </p>
                  </div>

                  {/* Dark Mode toggle */}
                  <div className={`p-4 rounded-[22px] border ${isDarkBg ? 'bg-white/[0.02] border-white/5' : 'bg-black/5 border-white/10'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-xl bg-[#b88c5a]/10 flex items-center justify-center text-[#b88c5a]">
                           {isDarkBg ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>}
                         </div>
                         <p className="text-white font-bold text-xs">Dark Mode</p>
                      </div>
                      <button 
                        onClick={() => setIsDarkBg(!isDarkBg)}
                        className={`w-10 h-5 rounded-full transition-all duration-300 relative ${isDarkBg ? 'bg-[#b88c5a]' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isDarkBg ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Atmosphere / Ambient Sounds */}
                  <div className={`p-4 rounded-[22px] border ${isDarkBg ? 'bg-white/[0.02] border-white/5' : 'bg-black/5 border-white/10'}`}>
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-9 h-9 rounded-xl bg-[#b88c5a]/10 flex items-center justify-center text-[#b88c5a]">
                         <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
                       </div>
                       <p className="text-white font-bold text-xs">Atmosphere</p>
                    </div>
                    <p className="text-white/30 text-[9px] leading-relaxed mb-4">
                      Add a background layer to your music or videos. Imagine listening while sitting in a forest or in the rain, creating a truly immersive environment.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                       {[
                         { id: 'none', label: 'Silence' },
                         { id: 'rain', label: 'Rainfall' },
                         { id: 'white', label: 'White Noise' },
                         { id: 'forest', label: 'Forest' }
                       ].map((sound) => (
                         <button
                           key={sound.id}
                           onClick={() => handleAmbientChange(sound.id)}
                           className={`py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${currentAmbient === sound.id ? 'bg-[#b88c5a] border-[#b88c5a] text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
                         >
                           {sound.label}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="flex-1 w-full overflow-y-auto scrollbar-hide px-1">
                <header className="mb-6 text-center mt-2">
                  <h2 className="text-white font-medium text-xs tracking-[0.2em] uppercase mb-1">About Pippofy</h2>
                  <div className="h-0.5 w-6 bg-[#b88c5a] mx-auto rounded-full" />
                </header>

                <div className="space-y-4 pb-10">
                  <div className={`p-5 rounded-[26px] border ${isDarkBg ? 'bg-white/[0.03] border-white/5' : 'bg-black/5 border-white/10'}`}>
                    <p className="text-white font-bold text-sm mb-2">The Experience</p>
                    <p className="text-white/40 text-[10px] leading-relaxed uppercase tracking-wider font-black mb-3">Premium Vinyl Interface</p>
                    <p className="text-white/60 text-[11px] leading-relaxed">
                      Pippofy brings the tactile warmth of vinyl to your digital library. Use the tonearm to start playback, and feel free to drag the disk to scratch or adjust the speed.
                    </p>
                  </div>

                  <div className={`p-5 rounded-[26px] border ${isDarkBg ? 'bg-white/[0.03] border-white/5' : 'bg-black/5 border-white/10'}`}>
                    <p className="text-[#b88c5a] font-bold text-sm mb-4 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      App Features
                    </p>
                    <ul className="space-y-3">
                      {[
                        { t: "Atmosphere", d: "A background audio layer that transports you to a different environment. Imagine listening to your favorite songs, podcasts, or YouTube videos while sitting in a deep forest or in the rain.", i: "🌊" },
                        { t: "Auto-Resume", d: "YouTube positions are saved automatically so you never lose your spot.", i: "🕒" },
                        { t: "Native Audio", d: "Play high-fidelity files directly from your mobile device.", i: "📱" },
                        { t: "Sleep Timer", d: "Fall asleep to curated soundscapes with automatic shutoff.", i: "🌙" }
                      ].map((f, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-sm shrink-0">{f.i}</span>
                          <div>
                            <p className="text-white font-bold text-[11px] mb-0.5">{f.t}</p>
                            <p className="text-white/40 text-[10px] leading-snug">{f.d}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`p-5 rounded-[26px] border border-[#b88c5a]/20 ${isDarkBg ? 'bg-[#b88c5a]/[0.02]' : 'bg-[#b88c5a]/[0.05]'}`}>
                    <p className="text-[#b88c5a] font-bold text-sm mb-3 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      Important Notes
                    </p>
                    <div className="space-y-2">
                      <p className="text-white/60 text-[10px] leading-relaxed italic">
                        <span className="text-white/80 font-bold">App Note:</span> YouTube background playback in the <span className="text-[#b88c5a]">Android App</span> is restricted by OS policies. It only plays when the app is open.
                      </p>
                      <p className="text-white/60 text-[10px] leading-relaxed italic">
                         <span className="text-white/80 font-bold">Website Power:</span> For full background YouTube listening (podcasts/lectures), visit <span className="text-white/90 underline font-black">pippofy.vercel.app</span> in your browser.
                      </p>
                      <p className="text-white/60 text-[10px] leading-relaxed italic">
                         <span className="text-white/80 font-bold">Device Audio:</span> Local MP3/WAV files <span className="text-green-400">DO</span> support full background playback and lock-screen controls in-app.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'controls' && (
              <>
                <header className="mb-4 text-center"><h2 className="text-white font-medium text-sm tracking-[0.2em] uppercase mb-1">Controls</h2><div className="h-0.5 w-8 bg-[#b88c5a] mx-auto rounded-full" /></header>
                <div className="grid grid-cols-2 gap-x-5 gap-y-4 w-full place-items-center">{ControlsPanel}</div>
                <div className="w-full mt-8">
                  <button className="flex items-center justify-center w-full h-14 rounded-2xl bg-[#b88c5a]/20 hover:bg-[#b88c5a]/30 p-4 focus:outline-none active:scale-95 transition-all border border-[#b88c5a]/30 text-[#b88c5a] font-bold uppercase tracking-widest text-[10px]"
                    onClick={() => { setSidebarOpen(false); setTimeout(() => setIsQueueOpen(true), 300); }}>
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                      Open Song Queue
                    </div>
                  </button>
                </div>
              </>
            )}
            
            {activeTab === 'playlists' && (
              <>
                <header className="mb-8 text-center"><h2 className="text-white font-medium text-xl tracking-[0.2em] uppercase mb-2">Playlists</h2><div className="h-0.5 w-12 bg-[#b88c5a] mx-auto rounded-full" /></header>
                <div className="flex-1 w-full overflow-hidden">{PlaylistsView}</div>
              </>
            )}
            <footer className="mt-auto pt-4 pb-6 border-t border-white/5 text-center"><p className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold py-2">Pippofy Premium Audio</p></footer>
          </div>

        {/* Mobile: Centered Disk Hero with Speed & Skip Controls */}
        <div className={`flex-1 flex flex-col items-center justify-center w-full relative z-40 px-4 transition-all duration-700 ${sidebarOpen ? 'scale-90 opacity-40 blur-sm' : 'scale-100 opacity-100'}`}>
          <div className="relative transform sm:scale-110 mb-2">
            <Disk 
              isPlaying={isPlaying} 
              videoUrl={queue[currentVideoIndex]?.url || ''} 
              onSeek={handleSeek} 
              onScratch={handleScratch}
              played={played} 
              duration={isLocalSong ? audioTagRef.current?.duration : playerRef.current?.getDuration()} 
              isLocal={isLocalSong}
            />
            <div className="absolute top-[-20%] right-[-15%] sm:right-[-40%] h-full w-full pointer-events-none">
              <Tonearm isPlaying={isPlaying} parkAngle="-2deg" playingAngle="12deg" />
            </div>
          </div>
          
          {/* Mobile Speed & Skip Controls */}
          <div className="flex items-center justify-between w-[220px] mt-6 mb-6 z-30 opacity-90 transition-opacity">
            <button 
              onClick={handleSkipBackward} 
              className={`group flex items-center justify-center w-12 h-12 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] active:scale-90 transition-all duration-300 pointer-events-auto text-white/80 rounded-xl border ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)] hover:bg-white/5' : 'bg-black/40 border-white/20 hover:bg-white/10'}`}
              title="Rewind 10s"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:-rotate-12 transition-transform duration-300">
                <path d="M12 5v0a9 9 0 1 1 -9 9" />
                <polygon points="12,1 7,5 12,9" fill="currentColor" strokeWidth="1" />
                <polygon points="17,1 12,5 17,9" fill="currentColor" strokeWidth="1" />
                <text x="12" y="17.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="currentColor" stroke="none">10</text>
              </svg>
            </button>

            <button 
              onClick={handleSkipForward} 
              className={`group flex items-center justify-center w-12 h-12 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] active:scale-90 transition-all duration-300 pointer-events-auto text-white/80 rounded-xl border ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)] hover:bg-white/5' : 'bg-black/40 border-white/20 hover:bg-white/10'}`}
              title="Skip 10s"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:rotate-12 transition-transform duration-300">
                <path d="M12 5v0a9 9 0 1 0 9 9" />
                <polygon points="12,1 17,5 12,9" fill="currentColor" strokeWidth="1" />
                <polygon points="7,1 12,5 7,9" fill="currentColor" strokeWidth="1" />
                <text x="12" y="17.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="currentColor" stroke="none">10</text>
              </svg>
            </button>
          </div>

          {/* Atmosphere Control: Icon + Text */}
          <div className="flex flex-col items-center gap-1 z-[500] mb-6 pointer-events-auto">
            <div className="relative">
              <button 
                className={`flex items-center justify-center gap-3 w-[220px] px-6 py-3 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] active:scale-95 transition-all duration-300 border ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)] hover:bg-white/5' : 'bg-black/40 border-white/20 hover:bg-white/10'}`}
                onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}
              >
                <div className="relative">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={currentAmbient !== 'none' ? 'text-white' : 'text-white/30'}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  {currentAmbient !== 'none' && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-white"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                </div>
                  <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${currentAmbient !== 'none' ? 'text-white' : 'text-white/40'}`}>
                    {currentAmbient === 'none' ? 'Atmosphere' : currentAmbient}
                  </span>
              </button>

              <AnimatePresence>
                {isAmbientMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-44 backdrop-blur-3xl rounded-[30px] p-2 z-[999] overflow-hidden ${isDarkBg ? 'bg-[#0d0d0d]/98 border border-white/10 shadow-[0_-30px_80px_rgba(0,0,0,1)]' : 'bg-black/40 border border-white/20 shadow-[0_-20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)]'}`}
                  >
                    {[
                      { id: 'none', label: 'Silence' },
                      { id: 'rain', label: 'Rainfall' },
                      { id: 'white', label: 'White Noise' },
                      { id: 'forest', label: 'Forest' }
                    ].map((sound) => (
                      <button
                        key={sound.id}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all border ${currentAmbient === sound.id ? 'bg-white/10 border-white/30 text-white font-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-transparent border-transparent text-white/30 hover:bg-white/5 hover:text-white/60'}`}
                        onClick={() => handleAmbientChange(sound.id)}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-[0.15em]">{sound.label}</span>
                        {currentAmbient === sound.id && (
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] bg-white`} />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


        </div>

        {/* Mobile: Bottom Input */}
        <div className={`w-full max-w-sm sm:max-w-md px-8 z-30 mb-2 mt-auto transition-all duration-500 ${sidebarOpen ? 'translate-y-20 opacity-0 pointer-events-none invisible' : 'translate-y-0 opacity-100'}`}>
          <div className="p-[2px] rounded-3xl bg-gradient-to-b from-white/20 to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className={`backdrop-blur-3xl rounded-[22px] overflow-hidden ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)]' : 'bg-black/40 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)]'}`}>
              <InputBox newVideoLink={newVideoLink} setNewVideoLink={setNewVideoLink} onAdd={handleAddVideo} />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          DESKTOP LAYOUT (hidden on mobile): Two-column app layout
      ========================================================= */}
      <div className="hidden lg:flex h-full w-full pt-16">

        {/* LEFT: Main Hero Area - Vinyl + Tonearm centered */}
        <div className={`flex-1 flex flex-col items-center justify-center relative px-8 xl:px-16 transition-all duration-700 ${sidebarOpen ? 'opacity-50 scale-[0.97] blur-[2px]' : 'opacity-100 scale-100 blur-0'}`}>

          {/* Vinyl + Tonearm Hero - shifted upward */}
          <div className="relative flex items-center justify-center w-full -mt-20">
            <div className="relative" style={{ width: 'min(80vh, 740px)', height: 'min(80vh, 740px)' }}>
              <Disk 
                isPlaying={isPlaying} 
                videoUrl={queue[currentVideoIndex]?.url || ''} 
                onSeek={handleSeek} 
                onScratch={handleScratch}
                played={played} 
                duration={isLocalSong ? audioTagRef.current?.duration : playerRef.current?.getDuration()} 
                isLocal={isLocalSong}
              />
              {/* Tonearm repositioned to be closer to the disc (moved more left) */}
              <div className="absolute top-[-25%] right-[-45%] h-full w-full pointer-events-none">
                <Tonearm isPlaying={isPlaying} parkAngle="0deg" />
              </div>
            </div>
          </div>

          {/* Currently Playing Info */}
          <div className="mt-4 text-center max-w-md">
            {currentSong ? (
              <>
                <p className="text-white/90 font-medium text-base tracking-wide truncate">{currentSong.title || 'Now Playing'}</p>
                <p className="text-white/30 text-xs mt-1 uppercase tracking-widest">{isPlaying ? 'Playing' : 'Paused'} · Pippofy</p>
              </>
            ) : null}
          </div>
          
          {/* Desktop Left-Side Controls Cluster */}
          <div className="absolute left-16 top-1/2 -translate-y-1/2 flex flex-col gap-8 z-40 items-center">
            {/* Desktop Speed & Skip Controls */}
            <div className="flex flex-col items-center gap-6 opacity-90 transition-opacity">
              <button 
                onClick={handleSkipBackward} 
                className={`group flex items-center justify-center w-14 h-14 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] active:scale-90 transition-all duration-300 pointer-events-auto text-white/80 rounded-2xl border ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)] hover:bg-white/5' : 'bg-black/40 border-white/20 hover:bg-white/10'}`}
                title="Rewind 10s"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:-rotate-12 transition-transform duration-300">
                  <path d="M12 5v0a9 9 0 1 1 -9 9" />
                  <polygon points="12,1 7,5 12,9" fill="currentColor" strokeWidth="1" />
                  <polygon points="17,1 12,5 17,9" fill="currentColor" strokeWidth="1" />
                  <text x="12" y="17.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="currentColor" stroke="none">10</text>
                </svg>
              </button>

              <button 
                onClick={handleSkipForward} 
                className={`group flex items-center justify-center w-14 h-14 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] active:scale-90 transition-all duration-300 pointer-events-auto text-white/80 rounded-2xl border ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)] hover:bg-white/5' : 'bg-black/40 border-white/20 hover:bg-white/10'}`}
                title="Skip 10s"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:rotate-12 transition-transform duration-300">
                  <path d="M12 5v0a9 9 0 1 0 9 9" />
                  <polygon points="12,1 17,5 12,9" fill="currentColor" strokeWidth="1" />
                  <polygon points="7,1 12,5 7,9" fill="currentColor" strokeWidth="1" />
                  <text x="12" y="17.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="currentColor" stroke="none">10</text>
                </svg>
              </button>
            </div>

            {/* Atmosphere Control (Desktop Home) */}
            <div className="relative pointer-events-auto">
              <button 
                className={`flex items-center justify-center w-14 h-14 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] active:scale-95 transition-all duration-300 border ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)] hover:bg-white/5' : 'bg-black/40 border-white/20 hover:bg-white/10'}`}
                onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}
                title="Atmosphere"
              >
                <div className="relative">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={currentAmbient !== 'none' ? 'text-[#b88c5a]' : 'text-white/80'}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                  </svg>
                  {currentAmbient !== 'none' && <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#b88c5a]"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#b88c5a]"></span></span>}
                </div>
              </button>

              <AnimatePresence>
                {isAmbientMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    className={`absolute left-full top-0 ml-6 w-52 backdrop-blur-3xl rounded-[36px] p-2.5 z-[200] overflow-hidden ${isDarkBg ? 'bg-[#111]/98 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)]' : 'bg-black/40 border border-white/20 shadow-[0_30px_80px_rgba(0,0,0,0.8)]'}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-white/20 px-4 py-4 border-b border-white/5 mb-2">Atmosphere</p>
                    {[
                      { id: 'none', label: 'Silence' },
                      { id: 'rain', label: 'Rainfall' },
                      { id: 'white', label: 'White Noise' },
                      { id: 'forest', label: 'Forest' }
                    ].map((sound) => (
                      <button
                        key={sound.id}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${currentAmbient === sound.id ? 'bg-[#b88c5a] border-[#b88c5a] text-white shadow-xl scale-[1.02]' : 'bg-transparent border-transparent text-white/30 hover:bg-white/5 hover:text-white/60'}`}
                        onClick={() => handleAmbientChange(sound.id)}
                      >
                        <span className="text-[11px] uppercase font-bold tracking-[0.2em]">{sound.label}</span>
                        {currentAmbient === sound.id && <div className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor] bg-white" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop Input */}
          <div className="mt-4 w-full max-w-lg">
            <div className="p-[2px] rounded-3xl bg-gradient-to-b from-white/20 to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              <div className={`backdrop-blur-3xl rounded-[22px] overflow-hidden ${isDarkBg ? 'bg-[#0d0d0d]/98 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)]' : 'bg-black/40 border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)]'}`}>
                <InputBox newVideoLink={newVideoLink} setNewVideoLink={setNewVideoLink} onAdd={handleAddVideo} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Slide-in Sidebar (triggered by hamburger) with rounded left corners */}
        {/* Desktop Overlay */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] transition-opacity duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Desktop Sidebar Panel */}
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${sidebarOpen ? 'translate-x-0 shadow-[-40px_0_100px_rgba(0,0,0,0.95)]' : 'translate-x-full shadow-none'} fixed top-0 right-0 h-full w-[380px] z-[110] flex flex-col rounded-l-[2.5rem] overflow-hidden bg-[#0d0d0d]/98 backdrop-blur-3xl border-l border-white/10`}>
          {/* Close Button & Sleep Timer */}
          <div className="flex flex-col px-8 pt-8 pb-6 border-b border-white/5 shrink-0">
            {/* Row 1: Action Icons (Top Row like Android) */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Sleep Timer */}
                <div className="relative">
                  <button 
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-700 active:scale-95 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] border backdrop-blur-3xl ${sleepTime ? (isDarkBg ? 'bg-[#0d0d0d]/98 border-[#b88c5a]/40 text-[#b88c5a]' : 'bg-black/20 border-[#b88c5a]/60 text-[#b88c5a]') : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white/60'}`}
                    onClick={() => setShowSleepDial(!showSleepDial)}
                  >
                    <div className="relative flex items-center justify-center text-current">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={sleepTime ? 'animate-pulse' : ''}>
                        <line x1="10" x2="14" y1="2" y2="2" />
                        <line x1="12" x2="15" y1="13" y2="10" />
                        <circle cx="12" cy="14" r="8" />
                        <line x1="2" x2="6" y1="9" y2="9" opacity="0.5" />
                        <line x1="2" x2="6" y1="13" y2="13" />
                        <line x1="2" x2="6" y1="17" y2="17" opacity="0.5" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-start gap-0">
                      {sleepTime && <span className="text-[7px] font-black uppercase tracking-tighter text-[#b88c5a] opacity-60 mb-[-2px]">Active</span>}
                      <span className={`text-[11px] font-black uppercase tracking-[0.3em] transition-colors duration-700 ${sleepTime ? 'text-[#b88c5a]' : 'text-white/30'}`}>
                        {sleepTime ? formatSleepTime(sleepTime) : "Timer"}
                      </span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {showSleepDial && (
                      <>
                        <div className="fixed inset-0 z-[190]" onClick={() => setShowSleepDial(false)} />
                        <SleepDial 
                          onSelect={(val) => { setSleepTime(val); setShowSleepDial(false); }} 
                          onClose={() => setShowSleepDial(false)} 
                          isDarkBg={isDarkBg}
                        />
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Settings toggle Icon Only */}
                <button
                  onClick={() => setActiveTab('settings')}
                  title="Settings"
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 active:scale-95 border backdrop-blur-3xl ${
                    activeTab === 'settings'
                      ? (isDarkBg ? 'bg-white/10 border-white/20 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'bg-[#b88c5a]/10 border-[#b88c5a]/30 text-[#b88c5a]')
                      : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white/60'
                  }`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
              </div>

              <button className={`p-3 rounded-[18px] transition-all group shrink-0 bg-white/5 border border-white/10 hover:bg-white/10`} onClick={() => setSidebarOpen(false)}>
                <svg className={`group-hover:rotate-90 transition-transform duration-500 text-white/30`} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Row 2: Controls/Playlists Tabs (below like Android) */}
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full shadow-inner">
              <button 
                onClick={() => setActiveTab('controls')} 
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.25em] rounded-xl transition-all duration-500 ${activeTab === 'controls' ? 'bg-[#b88c5a] text-white shadow-[0_10px_25px_rgba(184,140,90,0.4)]' : 'text-white/20 hover:text-white/60'}`}
              >
                Controls
              </button>
              <button 
                onClick={() => setActiveTab('playlists')} 
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.25em] rounded-xl transition-all duration-500 ${activeTab === 'playlists' ? 'bg-[#b88c5a] text-white shadow-[0_10px_25px_rgba(184,140,90,0.4)]' : 'text-white/20 hover:text-white/60'}`}
              >
                Playlists
              </button>
            </div>
          </div>

          {/* Scrollable Panel Content */}
          {activeTab === 'controls' && (
            <div className="flex flex-col flex-1 min-h-0 px-8 py-4">
              <header className="mb-4 text-center">
                <h2 className="text-white font-light text-base tracking-[0.3em] uppercase mb-1.5">Controls</h2>
                <div className="h-px w-10 bg-[#b88c5a] mx-auto rounded-full shadow-[0_0_10px_#b88c5a]" />
              </header>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 w-full place-items-center">
                {ControlsPanel}
              </div>
              <div className="mt-auto pt-6 shrink-0">
                <button 
                  className="flex items-center justify-center w-full h-14 rounded-2xl bg-[#b88c5a]/20 hover:bg-[#b88c5a]/30 focus:outline-none hover:scale-[1.02] active:scale-95 transition-all border border-[#b88c5a]/30 text-[#b88c5a] font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => { setSidebarOpen(false); setTimeout(() => setIsQueueOpen(true), 300); }}
                >
                  <div className="flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    Open Song Queue
                  </div>
                </button>
                <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold text-center mt-5 pb-2">Pippofy Premium Audio</p>
              </div>
            </div>
          )}
          
          {activeTab === 'playlists' && (
            <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
              <header className="mb-6 text-center shrink-0">
                <h2 className="text-white font-light text-xl tracking-[0.3em] uppercase mb-2">Playlists</h2>
                <div className="h-px w-12 bg-[#b88c5a] mx-auto rounded-full shadow-[0_0_12px_#b88c5a]" />
              </header>
              <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">{PlaylistsView}</div>
              <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold text-center mt-4 pt-4 border-t border-white/5 shrink-0">Pippofy Premium Audio</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex flex-col flex-1 min-h-0 px-8 py-8 overflow-y-auto scrollbar-hide">
              <header className="mb-10 text-center shrink-0">
                <h2 className="text-white font-light text-xl tracking-[0.3em] uppercase mb-2">App Settings</h2>
                <div className="h-px w-12 bg-[#b88c5a] mx-auto rounded-full shadow-[0_0_12px_#b88c5a]" />
              </header>
              
              <div className="space-y-6">
                <div className={`p-6 rounded-[2rem] border ${isDarkBg ? 'bg-white/[0.02] border-white/5' : 'bg-black/5 border-white/10'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                       <div className="w-11 h-11 rounded-2xl bg-[#b88c5a]/10 flex items-center justify-center text-[#b88c5a]">
                         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                       </div>
                       <div>
                         <p className="text-white font-bold text-sm">Auto-Resume</p>
                         <p className="text-white/20 text-[10px] uppercase font-black mt-0.5 tracking-tighter">Saves Progress</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setAutoBookmark(!autoBookmark)}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative ${autoBookmark ? 'bg-[#b88c5a]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${autoBookmark ? 'left-[1.6rem]' : 'left-1'}`} />
                    </button>
                  </div>
                  <p className="text-white/30 text-[12px] leading-relaxed">
                    Automatically remember and resume where you left off in YouTube videos.
                  </p>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDarkBg ? 'bg-white/[0.02] border-white/5' : 'bg-black/5 border-white/10'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-11 h-11 rounded-2xl bg-[#b88c5a]/10 flex items-center justify-center text-[#b88c5a]">
                         {isDarkBg ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>}
                       </div>
                       <p className="text-white font-bold text-sm">Dark Mode</p>
                    </div>
                    <button 
                      onClick={() => setIsDarkBg(!isDarkBg)}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative ${isDarkBg ? 'bg-[#b88c5a]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isDarkBg ? 'left-[1.6rem]' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Atmosphere / Ambient Sounds (Desktop) */}
                <div className={`p-6 rounded-[2rem] border ${isDarkBg ? 'bg-white/[0.02] border-white/5' : 'bg-black/5 border-white/10'}`}>
                  <div className="flex items-center gap-4 mb-5">
                     <div className="w-11 h-11 rounded-2xl bg-[#b88c5a]/10 flex items-center justify-center text-[#b88c5a]">
                       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
                     </div>
                     <p className="text-white font-bold text-sm">Atmosphere</p>
                  </div>
                  <p className="text-white/30 text-[12px] leading-relaxed mb-6">
                    Layer immersive environmental audio over your music. Perfect for deep focus, reading, or creating a cozy mood at home.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                     {[
                       { id: 'none', label: 'Silence' },
                       { id: 'rain', label: 'Rainfall' },
                       { id: 'white', label: 'White Noise' },
                       { id: 'forest', label: 'Forest' }
                     ].map((sound) => (
                       <button
                         key={sound.id}
                         onClick={() => handleAmbientChange(sound.id)}
                         className={`py-3 px-4 rounded-2xl border text-[11px] font-bold uppercase tracking-wider transition-all ${currentAmbient === sound.id ? 'bg-[#b88c5a] border-[#b88c5a] text-white shadow-xl scale-[1.02]' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
                       >
                         {sound.label}
                       </button>
                     ))}
                  </div>
                </div>
              </div>
              
              <p className="text-white/10 text-[9px] uppercase tracking-[0.3em] font-bold text-center mt-auto pt-6">Pippofy v1.0.4 Premium</p>
            </div>
          )}
        </div>
      </div>

      {/* Input placeholder space for mobile (handled above inline) */}
      <div className="hidden">
        <div className="p-[2px] rounded-3xl bg-gradient-to-b from-white/20 to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="bg-black/60 backdrop-blur-3xl rounded-[22px] overflow-hidden">
            <InputBox
              newVideoLink={newVideoLink}
              setNewVideoLink={setNewVideoLink}
              onAdd={handleAddVideo}
            />
          </div>
        </div>
      </div>

      {/* Dual Engine Playback */}
      {queue.length > 0 && (
        <>
          {/* YouTube Engine - Slightly visible to prevent background throttling */}
          {!isLocalSong && (
            <div className="absolute top-0 left-0 w-24 h-24 opacity-0 pointer-events-none -z-40 overflow-hidden">
              <ReactPlayer
                ref={playerRef}
                url={hasStartedInteractive ? currentSong?.url : ''}
                playing={isPlaying}
                playbackRate={playbackRate}
                progressInterval={1000}
                onProgress={({ played: p }) => {
                  setPlayed(p);
                }}
                onReady={() => {
                  if (pendingSeekRef.current !== null) {
                    playerRef.current.seekTo(pendingSeekRef.current, 'seconds');
                    const m = Math.floor(pendingSeekRef.current / 60);
                    const s = pendingSeekRef.current % 60;
                    showToast(`Resumed from ${m}:${String(s).padStart(2, '0')}`);
                    pendingSeekRef.current = null;
                  }
                }}
                onEnded={() => {
                  setPlayed(0);
                  if (playbackMode === 'repeat-song') {
                    playerRef.current?.seekTo(0);
                    setIsPlaying(true);
                  } else if (playbackMode === 'shuffle') {
                    const nextIndex = Math.floor(Math.random() * queue.length);
                    setCurrentVideoIndex(nextIndex);
                  } else if (playbackMode === 'repeat-queue') {
                    setCurrentVideoIndex((prev) => (prev + 1) % queue.length);
                  } else {
                    // Sequential
                    if (currentVideoIndex < queue.length - 1) {
                      setCurrentVideoIndex(prev => prev + 1);
                    } else {
                      setIsPlaying(false);
                      setCurrentVideoIndex(0);
                    }
                  }
                }}
                onError={(e) => {
                  console.error("ReactPlayer error:", e);
                  // Auto-skip on failure so we don't get permanently stuck
                  if (currentVideoIndex < queue.length - 1) {
                    setCurrentVideoIndex(prev => prev + 1);
                  } else {
                    setIsPlaying(false);
                    setCurrentVideoIndex(0);
                  }
                }}
                width="100%"
                height="100%"
                config={YOUTUBE_CONFIG}
              />
            </div>
          )}

          {/* Local/Native Engine (Much better for background play) */}
          <audio
            ref={audioTagRef}
            className="hidden"
            preload="auto"
            playsInline
            autoPlay={isPlaying}
            onCanPlay={(e) => {
              e.target.preservesPitch = false; // Enable vinyl chipmunk/deep effects
            }}
            onTimeUpdate={(e) => {
              const audio = e.target;
              if (!isFinite(audio.currentTime) || !isFinite(audio.duration)) return;
              
              const now = Date.now();
              if (now - lastProgressUpdate.current >= 1000) {
                lastProgressUpdate.current = now;
                const progress = audio.currentTime / audio.duration;
                if (isFinite(progress)) {
                  setPlayed(progress);
                }
              }
            }}
            onEnded={() => {
              setPlayed(0);
              if (playbackMode === 'repeat-song') {
                audioTagRef.current.currentTime = 0;
                audioTagRef.current.play();
              } else if (playbackMode === 'shuffle') {
                const nextIndex = Math.floor(Math.random() * queue.length);
                setCurrentVideoIndex(nextIndex);
              } else if (playbackMode === 'repeat-queue') {
                setCurrentVideoIndex((prev) => (prev + 1) % queue.length);
              } else {
                // Sequential
                if (currentVideoIndex < queue.length - 1) {
                  setCurrentVideoIndex(prev => prev + 1);
                } else {
                  setIsPlaying(false);
                  setCurrentVideoIndex(0);
                }
              }
            }}
          />
        </>
      )}
    </div>
  );
}