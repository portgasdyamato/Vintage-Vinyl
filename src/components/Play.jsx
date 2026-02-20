import React, { useState, useEffect, useRef } from 'react';
import '../App.css';
import play from '../assets/play.png';
import stop from '../assets/stop.png';
import repeat from '../assets/repeat.png';
import repeaty from '../assets/repeaty.png';
import back from '../assets/back.png';
import next from '../assets/next.png';
import add from '../assets/add.png';
import dl from '../assets/dl.png';
import dw from '../assets/dw.png';
import board from '../assets/board.png';
import Tonearm from './Tonearm';
import ReactPlayer from 'react-player';
import InputBox from './InputBox';
import Disk from './Disk';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { CapacitorMusicControls } from 'capacitor-music-controls-plugin';

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
}) {
  const [newVideoLink, setNewVideoLink] = useState(''); // Input for new video link
  const [isRepeat, setIsRepeat] = useState(false); // State to track repeat mode
  const [activeTab, setActiveTab] = useState('controls'); // controls | playlists
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const playerRef = useRef(null);
  const audioTagRef = useRef(null); // Dedicated local audio engine
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const currentSong = queue[currentVideoIndex];
  const isLocalSong = currentSong?.isLocal || currentSong?.url?.startsWith('_capacitor_file_') || currentSong?.url?.startsWith('blob:');

  // Function to initialize Web Media Session (Standard)
  const initMediaSession = () => {
    if ('mediaSession' in navigator && queue.length > 0) {
      const isYouTube = currentSong?.url?.includes('youtube.com') || currentSong?.url?.includes('youtu.be');
      const thumbnail = isYouTube
        ? `https://img.youtube.com/vi/${currentSong.url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/)?.[1]}/hqdefault.jpg`
        : 'https://raw.githubusercontent.com/portgasdyamato/Vintage-Vinyl/main/public/vite.svg';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong?.title || 'Pippofy Track',
        artist: `Pippofy • ${isRepeat ? '🔂 Looping' : '▶️ Sequential'}`,
        album: 'Vinyl Collection',
        artwork: [
          { src: thumbnail, sizes: '96x96', type: 'image/png' },
          { src: thumbnail, sizes: '128x128', type: 'image/png' },
          { src: thumbnail, sizes: '192x192', type: 'image/png' },
          { src: thumbnail, sizes: '256x256', type: 'image/png' },
          { src: thumbnail, sizes: '384x384', type: 'image/png' },
          { src: thumbnail, sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => {
          actionHandlersRef.current.prev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
          actionHandlersRef.current.next();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
          const time = details.seekTime;
          if (isLocalSong && audioTagRef.current) audioTagRef.current.currentTime = time;
          else if (playerRef.current) playerRef.current.seekTo(time);
          updatePositionState();
      });

      // Duration/Position Sync (Spotify Bar)
      const updatePositionState = () => {
          if ('setPositionState' in navigator.mediaSession) {
              const duration = isLocalSong ? audioTagRef.current?.duration : playerRef.current?.getDuration();
              const position = isLocalSong ? audioTagRef.current?.currentTime : playerRef.current?.getCurrentTime();
              if (duration && position) {
                  navigator.mediaSession.setPositionState({
                      duration: duration,
                      playbackRate: 1,
                      position: position
                  });
              }
          }
      };
      updatePositionState();
    }
  };

  // Silent Proxy Engine: Tricks Android into showing the premium "Spotify-Style" Card
  const silentProxyRef = useRef(null);
  const hasAlertedRef = useRef(''); // Reusing as track URL store
  const lastTrackRef = useRef('');

  const actionHandlersRef = useRef({
    next: () => setCurrentVideoIndex((prev) => (prev + 1) % queue.length),
    prev: () => setCurrentVideoIndex((prev) => (prev === 0 ? queue.length - 1 : prev - 1)),
    toggle: () => setIsPlaying(prev => !prev)
  });

  useEffect(() => {
    actionHandlersRef.current = {
        next: () => setCurrentVideoIndex((prev) => (prev + 1) % queue.length),
        prev: () => setCurrentVideoIndex((prev) => (prev === 0 ? queue.length - 1 : prev - 1)),
        toggle: () => setIsPlaying(prev => !prev)
    };
  }, [queue.length, setCurrentVideoIndex, setIsPlaying]);

  useEffect(() => {
    const handleControlsEvent = (event) => {
        const message = event.message || event.action;
        if (message === 'music-controls-next') actionHandlersRef.current.next();
        else if (message === 'music-controls-previous') actionHandlersRef.current.prev();
        else if (message === 'music-controls-pause') actionHandlersRef.current.toggle();
        else if (message === 'music-controls-play') actionHandlersRef.current.toggle();
        else if (message === 'music-controls-destroy') { /* App closed */ }
    };
    
    document.addEventListener("controlsNotification", handleControlsEvent);
    return () => {
        document.removeEventListener("controlsNotification", handleControlsEvent);
    };
  }, []);

  useEffect(() => {
    if (!silentProxyRef.current) {
        // High-compatibility silent WAV (slightly longer to claim focus)
        silentProxyRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silentProxyRef.current.loop = true;
    }
    
    const proxy = silentProxyRef.current;
    
    const syncPlayback = async () => {
        if (queue.length > 0) {
            initMediaSession();
            if (isPlaying) {
                try {
                   proxy.volume = 0.01; 
                   await proxy.play();
                   if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                } catch (e) {}
            } else {
                proxy.pause();
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            }
        }
    };
    const ensureMediaCard = async () => {
        if (queue.length > 0) {
            const currentUrl = currentSong?.url || '';
            const needsCreate = lastTrackRef.current !== currentUrl;

            if (needsCreate) {
                try {
                    const isYouTube = currentSong?.url?.includes('youtube.com') || currentSong?.url?.includes('youtu.be');
                    const thumbnail = isYouTube
                        ? `https://img.youtube.com/vi/${currentSong.url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/)?.[1]}/hqdefault.jpg`
                        : '';

                    await CapacitorMusicControls.create({
                        track: currentSong?.title || 'Playing Music',
                        artist: 'Pippofy Audio Player',
                        album: '',
                        cover: thumbnail,
                        isPlaying: isPlaying,
                        dismissable: false,
                        hasPrev: true,
                        hasNext: true,
                        hasClose: false,
                        ticker: `Now playing ${currentSong?.title || 'Music'}`,
                        playIcon: '',
                        pauseIcon: '',
                        prevIcon: '',
                        nextIcon: '',
                        closeIcon: '',
                        notificationIcon: ''
                    });
                    lastTrackRef.current = currentUrl;
                } catch (e) {}
            } else {
                try {
                    await CapacitorMusicControls.updateIsPlaying({ isPlaying: isPlaying });
                } catch (e) {}
            }
        }
    };

    ensureMediaCard();
    syncPlayback();
    const heartbeat = setInterval(() => {
        syncPlayback();
        if (isPlaying) updatePositionState(); // Keep the seek bar moving
    }, 5000);

    // Initial position sync
    const updatePositionState = () => {
        if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
            try {
                const duration = isLocalSong ? audioTagRef.current?.duration : playerRef.current?.getDuration();
                const position = isLocalSong ? audioTagRef.current?.currentTime : playerRef.current?.getCurrentTime();
                if (duration > 0 && position >= 0) {
                    navigator.mediaSession.setPositionState({
                        duration: duration,
                        playbackRate: 1,
                        position: Math.min(position, duration)
                    });
                }
            } catch (e) {}
        }
    };

    return () => {
        clearInterval(heartbeat);
        proxy.pause();
    };
  }, [isPlaying, currentVideoIndex, isRepeat, queue.length, isLocalSong, currentSong]);

  // Navbar Event Listener
  useEffect(() => {
    const handlePick = () => fileInputRef.current?.click();
    window.addEventListener('open-file-pick', handlePick);
    return () => window.removeEventListener('open-file-pick', handlePick);
  }, []);

  // Metadata Heartbeat (Atomic Updates)
  useEffect(() => {
    if (queue.length > 0) {
        initMediaSession();
    }
  }, [currentVideoIndex, isPlaying]);
  // Sync Video with Background Progress
  useEffect(() => {
    if (queue.length > 0 && isPlaying) {
        // Track progress for local audio
        const interval = setInterval(() => {
            if (isLocalSong && audioTagRef.current) {
                setPlayed(audioTagRef.current.currentTime / audioTagRef.current.duration || 0);
            }
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [isPlaying, currentVideoIndex, queue, isLocalSong]);

  useEffect(() => {
    if (queue.length > 0) {
      if (isLocalSong) {
        if (audioTagRef.current) {
            audioTagRef.current.src = currentSong.url;
            if (isPlaying) audioTagRef.current.play().catch(() => {});
        }
      }
      setIsPlaying(true); 
    }
  }, [queue, currentVideoIndex]);

  useEffect(() => {
    if (isLocalSong && audioTagRef.current) {
        if (isPlaying) audioTagRef.current.play().catch(() => {});
        else audioTagRef.current.pause();

        // Handle End of Song (Repeat Logic)
        audioTagRef.current.onended = () => {
            if (isRepeat) {
                audioTagRef.current.currentTime = 0;
                audioTagRef.current.play();
            } else {
                setCurrentVideoIndex((prev) => (prev + 1) % queue.length);
            }
        };
    }
  }, [isPlaying, isLocalSong, isRepeat, queue.length]);

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

  const fetchVideoTitle = async (videoId) => {
    const apiKey = 'AIzaSyBepNVCKYHPahyaSSTpz-lPFo_n2khb5v8'; // Replace with your YouTube Data API key
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].snippet.title; // Return the video title
      }
    } catch (error) {
      console.error('Error fetching video title:', error);
    }
    return 'Unknown Title'; // Fallback title
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
    if (newVideoLink.trim() !== '') {
      const isPlaylist = newVideoLink.includes('list='); // Check if the link is a playlist
      if (isPlaylist) {
        const playlistId = extractPlaylistId(newVideoLink); // Extract the playlist ID
        if (playlistId) {
          const videos = await fetchPlaylistVideos(playlistId); // Fetch videos from the playlist
          if (videos.length > 0) {
            const updatedQueue = videos.map((video) => ({
              url: `https://www.youtube.com/watch?v=${video.videoId}`,
              title: video.title, // Use the actual title of the video
            }));
            setQueue((prevQueue) => [...prevQueue, ...updatedQueue]); // Add all videos to the queue
          } else {
            alert('No videos found in the playlist.');
          }
        } else {
          alert('Invalid playlist link.');
        }
      } else {
        const videoId = extractVideoId(newVideoLink); // Extract the video ID
        if (videoId) {
          const title = await fetchVideoTitle(videoId); // Fetch the video title
          setQueue((prevQueue) => [...prevQueue, { url: newVideoLink, title }]); // Add the video to the queue
        } else {
          alert('Invalid video link.');
        }
      }
      setNewVideoLink(''); // Clear the input field
    } else {
      alert('Please enter a valid YouTube link.'); // Show alert if the input box is empty
    }}

  const handleClearQueue = () => {
    setQueue([]); // Clear the queue
    setIsPlaying(false); // Stop playback
    setCurrentVideoIndex(0); // Reset the current video index
  };

  const handleSeek = (progress) => {
    setPlayed(progress);
    if (isLocalSong && audioTagRef.current) {
        audioTagRef.current.currentTime = progress * audioTagRef.current.duration;
    } else if (playerRef.current) {
        playerRef.current.seekTo(progress);
    }
  };

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
      // Process all files in parallel
      const newSongs = await Promise.all(files.map(async (file) => {
        try {
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.readAsDataURL(file);
            reader.onload = async () => {
              const base64Data = reader.result.split(',')[1];
              const fileName = `song_${Date.now()}_${file.name}`;
              
              await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Data
              });

              const { uri } = await Filesystem.getUri({
                path: fileName,
                directory: Directory.Data
              });

              resolve({
                url: Capacitor.convertFileSrc(uri),
                title: file.name.replace(/\.[^/.]+$/, ""),
                isLocal: true,
                isLive: true
              });
            };
          });
        } catch (err) {
          const url = URL.createObjectURL(file);
          return { url, title: file.name, isLocal: true, isLive: true };
        }
      }));

      setQueue(prev => [...prev, ...newSongs]);
      if (queue.length === 0) {
        setCurrentVideoIndex(0);
        setIsPlaying(true);
      }
    }
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
        alert(`Successfully found and added ${foundSongs.length} local tracks!`);
      } else {
        alert('No music files found in standard folders.');
      }
    } catch (err) {
      alert('Permission denied or issue accessing storage.');
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
      alert("No song currently playing to add!");
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
    alert(`Added to playlist!`);
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
      alert('This playlist is empty!');
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
        alert('Playlist data copied to clipboard! (Experimental)');
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
      {/* Row 1 */}
      <button className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-transparent p-0 focus:outline-none hover:scale-110 active:scale-95 transition-transform" onClick={async () => {
        initMediaSession(); // Anchor notification to this gesture
        setIsPlaying(!isPlaying); // Toggle global play state
      }}>
        <img src={isPlaying ? stop : play} alt={isPlaying ? 'Stop' : 'Play'} className="w-full h-full object-contain drop-shadow-xl" />
      </button>
      <button className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-transparent p-0 focus:outline-none hover:scale-110 active:scale-95 transition-transform" onClick={() => setIsRepeat(!isRepeat)}>
        <img src={isRepeat ? repeat : repeaty} alt="Repeat" className="w-full h-full object-contain drop-shadow-xl" />
      </button>
      {/* Row 2 */}
      <button className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-transparent p-0 focus:outline-none hover:scale-110 active:scale-95 transition-transform" onClick={() => setCurrentVideoIndex((prev) => (prev === 0 ? queue.length - 1 : prev - 1))}>
        <img src={back} alt="Back" className="w-full h-full object-contain drop-shadow-xl" />
      </button>
      <button className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-transparent p-0 focus:outline-none hover:scale-110 active:scale-95 transition-transform" onClick={() => {
        if (queue.length > 0) {
          setCurrentVideoIndex((prev) => (prev + 1) % queue.length);
        }
      }}>
        <img src={next} alt="Next" className="w-full h-full object-contain drop-shadow-xl" />
      </button>
      {/* Row 3: Add to Playlist & Device */}
      <button 
        className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-transparent p-0 focus:outline-none hover:scale-110 active:scale-95 transition-transform" 
        onClick={() => setShowPlaylistPicker(true)} 
        title="Add to Playlist"
      >
        <img src={add} alt="Add" className="w-full h-full object-contain drop-shadow-xl" />
      </button>
      <button className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-transparent p-0 focus:outline-none hover:scale-110 active:scale-95 transition-transform" onClick={() => fileInputRef.current.click()} title="Play From Device">
        <svg className="w-[60%] h-[60%] text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" multiple className="hidden" />
      </button>

      {/* Row 4: Clear Queue & Favorite */}
      <button className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-transparent p-0 focus:outline-none hover:scale-110 active:scale-95 transition-transform" onClick={handleClearQueue} title="Clear Queue">
        <img src={dl} alt="Clear" className="w-full h-full object-contain drop-shadow-xl" />
      </button>

      <button 
        className={`flex items-center justify-center w-[72px] h-[72px] rounded-full bg-transparent p-0 focus:outline-none hover:scale-110 active:scale-95 transition-all ${favorites.some(f => f.url === queue[currentVideoIndex]?.url) ? 'text-red-500' : 'text-white/70'}`} 
        onClick={() => {
          if (queue[currentVideoIndex]) toggleFavorite(queue[currentVideoIndex]);
        }}
        title="Favorite"
      >
        <svg className="w-[60%] h-[60%]" viewBox="0 0 24 24" fill={favorites.some(f => f.url === queue[currentVideoIndex]?.url) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-10 py-3 text-white text-sm focus:outline-none focus:border-[#b88c5a]/50 transition-all shadow-inner"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#b88c5a] transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
                className="w-full bg-white/5 border border-white/10 text-white/60 py-3 rounded-2xl text-[10px] font-bold hover:bg-[#b88c5a] hover:text-white active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Create Playlist
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-4 pb-20">
            {playlists.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <p className="text-white/30 text-center text-xs italic mt-10">
                {searchQuery ? "No matching playlists found" : "No playlists yet. Create one above!"}
              </p>
            ) : (
              playlists
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((playlist) => (
                <div key={playlist.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 group hover:bg-white/[0.08] transition-all">
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
                        <span className="text-white font-bold text-sm block cursor-default" onClick={() => setSelectedPlaylistId(playlist.id)}>
                          {playlist.name}
                        </span>
                      )}
                      <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">{playlist.songs.length} Tracks</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleDeletePlaylist(playlist.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-white/30 hover:text-red-500 transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePlayPlaylist(playlist)}
                      className="w-full bg-white/[0.05] hover:bg-[#b88c5a] text-white py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-3"
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
        <div className="flex flex-col h-full bg-white/[0.02] rounded-2xl p-4">
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
                className="bg-white/5 text-white/40 p-2 rounded-lg hover:bg-white/10 transition-all"
                title="Rename"
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
                  setEditingPlaylistId(null);
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
              playlists.find(p => p.id === selectedPlaylistId)?.songs.map((song, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 group">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-white text-xs font-medium truncate">{song.title}</p>
                    <p className="text-white/30 text-[10px] uppercase tracking-tighter mt-0.5">{song.isLocal ? 'Local Audio' : 'YouTube'}</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveSongFromPlaylist(selectedPlaylistId, song.url)}
                    className="shrink-0 text-white/20 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full pt-16 pb-20 overflow-hidden bg-transparent">
      {/* Desktop/laptop: original board and controls layout */}
      <div className="main-controls hidden lg:block">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={board}
            alt=""
            className="w-[30%] h-auto opacity-80"
          />
        </div>
        <div className="absolute top-0 left-6 z-10 flex flex-col items-center justify-center pointer-events-none" style={{ width: '25%', height: '85%' }}>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[220px] h-[420px] flex flex-col items-center justify-center pointer-events-auto">
            <div className="grid grid-cols-2 grid-rows-4 gap-x-15 gap-y-8 w-full h-full items-center justify-center">
              {ControlsPanel}
            </div>
          </div>
        </div>
      </div>



      {/* Mobile: sidebar for controls - True Glassmorphism */}
      {/* Sidebar for controls & Playlists - Unified Glassmorphism */}
      <>
        <div 
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-500 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />
        <div className={`mobile-sidebar transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-[#0a0a0a]/95 backdrop-blur-[40px] z-[110] p-5 sm:p-8 flex flex-col shadow-[-10px_0_60px_rgba(0,0,0,0.8)] border-l border-white/10`}>
          <button className="self-end mb-4 p-3 hover:bg-white/10 rounded-full transition-all group" onClick={() => setSidebarOpen(false)}>
            <svg className="group-hover:rotate-90 transition-transform duration-500 text-white/50" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div className={`flex flex-col items-center flex-1 w-full ${activeTab === 'controls' ? 'overflow-hidden justify-center' : 'overflow-y-auto scrollbar-hide'}`}>
            <div className="flex w-full mb-8 bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setActiveTab('controls')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'controls' ? 'bg-[#b88c5a] text-white shadow-lg' : 'text-white/40'}`}
              >
                Controls
              </button>
              <button 
                onClick={() => setActiveTab('playlists')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'playlists' ? 'bg-[#b88c5a] text-white shadow-lg' : 'text-white/40'}`}
              >
                Playlists
              </button>
            </div>

            {activeTab === 'controls' ? (
              <>
                <header className="mb-6 text-center">
                  <h2 className="text-white font-medium text-lg tracking-[0.2em] uppercase mb-1">Controls</h2>
                  <div className="h-0.5 w-10 bg-[#b88c5a] mx-auto rounded-full shadow-[0_0_8px_#b88c5a]" />
                </header>
                <div className="grid grid-cols-2 gap-x-6 gap-y-6 w-full place-items-center">
                  {ControlsPanel}
                </div>

                <div className="w-full mt-8">
                  <button 
                    className="flex items-center justify-center w-full h-14 rounded-2xl bg-[#b88c5a]/20 hover:bg-[#b88c5a]/30 p-4 focus:outline-none hover:scale-[1.02] active:scale-95 transition-all border border-[#b88c5a]/30 shadow-lg text-[#b88c5a] font-bold uppercase tracking-widest text-[10px]" 
                    onClick={() => {
                      setSidebarOpen(false);
                      setTimeout(() => setIsQueueOpen(true), 300);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                      Open Song Queue
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <header className="mb-8 text-center">
                  <h2 className="text-white font-medium text-xl tracking-[0.2em] uppercase mb-2">Playlists</h2>
                  <div className="h-0.5 w-12 bg-[#b88c5a] mx-auto rounded-full shadow-[0_0_10px_#b88c5a]" />
                </header>
                <div className="flex-1 w-full overflow-hidden">
                  {PlaylistsView}
                </div>
              </>
            )}
          </div>

          <footer className="mt-auto pt-4 pb-6 border-t border-white/5 text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold py-2">Pippofy Premium Audio</p>
          </footer>
        </div>

        {/* Playlist Picker Popup - Universal */}
        {showPlaylistPicker && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPlaylistPicker(false)} />
            <div className="relative w-full max-w-sm bg-[#1a1a1a] rounded-3xl border border-white/10 p-6 shadow-2xl animate-slide-in">
              <h3 className="text-white font-bold text-lg mb-4 flex justify-between items-center">
                Add to Playlist
                <button onClick={() => setShowPlaylistPicker(false)} className="text-white/30 hover:text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {playlists.length === 0 ? (
                  <p className="text-white/30 text-center text-sm py-10">You haven't created any playlists yet.</p>
                ) : (
                  playlists.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => handleAddSongToPlaylist(p.id, queue[currentVideoIndex])}
                      className="w-full flex items-center justify-between bg-white/5 hover:bg-[#b88c5a]/20 p-4 rounded-2xl border border-white/5 hover:border-[#b88c5a]/40 transition-all group"
                    >
                      <span className="text-white/80 group-hover:text-white font-medium">{p.name}</span>
                      <svg className="text-white/20 group-hover:text-[#b88c5a]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  ))
                )}
              </div>
              <button 
                onClick={() => {
                  setShowPlaylistPicker(false);
                  setActiveTab('playlists');
                  setSidebarOpen(true);
                }}
                className="w-full mt-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all font-serif"
              >
                Create New Playlist
              </button>
            </div>
          </div>
        )}
      </>

      {/* Disk Section - Enlarged for Mobile Hero Presence */}
      <div className={`flex-1 flex items-center justify-center w-full relative z-10 px-4 transition-all duration-1000 ${sidebarOpen ? 'scale-90 opacity-40 blur-sm' : 'scale-100 opacity-100 blur-0'}`}>
        <div className="relative transform sm:scale-110 lg:scale-125">
          <Disk
            isPlaying={isPlaying}
            videoUrl={queue[currentVideoIndex]?.url || ''}
            onSeek={handleSeek}
            played={played}
            duration={isLocalSong ? audioTagRef.current?.duration : playerRef.current?.getDuration()}
          />
          {/* Tonearm positioned relative to disk for better alignment */}
          <div className="absolute top-[-20%] right-[-15%] sm:right-[-25%] h-full w-full pointer-events-none">
            <Tonearm isPlaying={isPlaying} />
          </div>
        </div>
      </div>

      {/* Input for Adding Videos - Floats at the bottom */}
      <div className={`w-full max-w-md px-8 z-30 mb-6 transition-all duration-500 ${sidebarOpen ? 'translate-y-20 opacity-0 pointer-events-none invisible' : 'translate-y-0 opacity-100'}`}>
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
          {/* YouTube Engine */}
          {!isLocalSong && (
            <ReactPlayer
              ref={playerRef}
              url={currentSong?.url}
              playing={isPlaying}
              onProgress={({ played }) => setPlayed(played)}
              onEnded={() => {
                if (isRepeat) {
                  setIsPlaying(false);
                  setTimeout(() => setIsPlaying(true), 10);
                } else if (currentVideoIndex < queue.length - 1) {
                  setCurrentVideoIndex((prev) => prev + 1);
                } else {
                  setIsPlaying(false);
                  setCurrentVideoIndex(0);
                }
              }}
              width="0"
              height="0"
              config={{
                youtube: {
                  playerVars: { autoplay: 1, controls: 0, modestbranding: 1 }
                }
              }}
            />
          )}

          {/* Local/Native Engine (Much better for background play) */}
          <audio
            ref={audioTagRef}
            className="hidden"
            onTimeUpdate={(e) => {
              setPlayed(e.target.currentTime / e.target.duration);
            }}
            onEnded={() => {
              if (isRepeat) {
                audioTagRef.current.currentTime = 0;
                audioTagRef.current.play();
              } else if (currentVideoIndex < queue.length - 1) {
                setCurrentVideoIndex((prev) => prev + 1);
              } else {
                setIsPlaying(false);
                setCurrentVideoIndex(0);
              }
            }}
          />
        </>
      )}
    </div>
  );
}