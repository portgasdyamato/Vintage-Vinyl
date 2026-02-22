import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import pippofy from '../assets/pippofy.png';
import menu from '../assets/menu.png';
import Play from './Play';
import AnimatedList from './Queue';
import { Preferences } from '@capacitor/preferences';

export default function Navbar({ isDarkBg, setIsDarkBg }) {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const listRef = useRef(null);
  const [isMenuClicked, setIsMenuClicked] = useState(false);
  const [queue, setQueue] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoBookmark, setAutoBookmark] = useState(false); // Timestamp resume feature

  // Sync favorites, playlists, queue remaining unchanged...



  // Sync favorites, playlists, queue
  useEffect(() => {
    const loadFavorites = async () => {
      const { value } = await Preferences.get({ key: 'favorites' });
      if (value) {
        setFavorites(JSON.parse(value));
      }
    };
    loadFavorites();

    const loadPlaylists = async () => {
      const { value } = await Preferences.get({ key: 'playlists' });
      if (value) {
        setPlaylists(JSON.parse(value));
      }
    };
    loadPlaylists();

    const loadQueueState = async () => {
      const { value: savedQueue } = await Preferences.get({ key: 'queue' });
      if (savedQueue) {
        try { setQueue(JSON.parse(savedQueue)); } catch(e) {}
      }
      const { value: savedIndex } = await Preferences.get({ key: 'currentVideoIndex' });
      if (savedIndex !== null && savedIndex !== undefined) {
        setCurrentVideoIndex(Number(savedIndex));
      }
    };
    loadQueueState();

    const loadAutoBookmark = async () => {
      const { value } = await Preferences.get({ key: 'autoBookmark' });
      if (value !== null) setAutoBookmark(value === 'true');
    };
    loadAutoBookmark();
  }, []);

  // Save favorites when updated
  useEffect(() => {
    const saveFavorites = async () => {
      await Preferences.set({
        key: 'favorites',
        value: JSON.stringify(favorites),
      });
    };
    saveFavorites();
  }, [favorites]);

  // Save playlists when updated
  useEffect(() => {
    const savePlaylists = async () => {
      await Preferences.set({
        key: 'playlists',
        value: JSON.stringify(playlists),
      });
    };
    savePlaylists();
  }, [playlists]);

  // Save queue when updated
  useEffect(() => {
    const saveQueue = async () => {
      await Preferences.set({
        key: 'queue',
        value: JSON.stringify(queue),
      });
    };
    saveQueue();
  }, [queue]);

  // Save currentVideoIndex when updated
  useEffect(() => {
    const saveIndex = async () => {
      await Preferences.set({
        key: 'currentVideoIndex',
        value: currentVideoIndex.toString(),
      });
    };
    saveIndex();
  }, [currentVideoIndex]);

  // Persist autoBookmark setting
  useEffect(() => {
    Preferences.set({ key: 'autoBookmark', value: autoBookmark.toString() });
  }, [autoBookmark]);


  useEffect(() => {
    if (!isQueueOpen) return;
    function handleClickOutside(event) {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setIsQueueOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQueueOpen]);

  const toggleQueue = () => {
    setIsQueueOpen(!isQueueOpen); // Toggle the Queue visibility
  };

  const addVideoToQueue = (video) => {
    setQueue((prevQueue) => [...prevQueue, video]); // Add a new video to the queue
  };

  const handleItemSelect = (item, tab, index) => {
    if (tab === 'favorites') {
      setQueue((prevQueue) => {
        const existingIndex = prevQueue.findIndex(q => q.url === item.url);
        if (existingIndex !== -1) {
          setTimeout(() => {
            setCurrentVideoIndex(existingIndex);
            setIsPlaying(true);
          }, 0);
          return prevQueue;
        } else {
          setTimeout(() => {
            setCurrentVideoIndex(prevQueue.length);
            setIsPlaying(true);
          }, 0);
          return [...prevQueue, item];
        }
      });
    } else {
      setCurrentVideoIndex(index);
      setIsPlaying(true);
    }
  };

  const handleClearQueue = () => {
    setQueue([]);
    setIsPlaying(false);
    setCurrentVideoIndex(0);
  };

  const handleRemove = (index) => {
    const updatedQueue = queue.filter((_, i) => i !== index); // Remove the item at the given index
    setQueue(updatedQueue); // Update the queue state

    // If the removed item is the currently playing video, reset playback
    if (updatedQueue.length === 0) {
      setIsPlaying(false); // Stop playback
      setCurrentVideoIndex(0); // Reset the current video index
    } else if (index === currentVideoIndex) {
      // If the removed item is the currently playing video, reset to the first video
      setCurrentVideoIndex(0);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 pt-8 pointer-events-none">
        <div className="container mx-auto px-6 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center cursor-pointer transition-all duration-500 hover:scale-110 active:scale-95">
            <img
              src={pippofy}
              alt="Logo"
              className="h-14 w-auto sm:h-16 transition-all duration-700 filter drop-shadow-[0_0_15px_rgba(184,140,90,0.3)]"
            />
          </div>

          <div className="flex gap-4">
            <button 
              className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-3xl active:scale-90 transition-all duration-300 pointer-events-auto border ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)] hover:bg-white/5' : 'bg-black/40 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] hover:bg-white/10'}`}
              onClick={() => setIsDarkBg(!isDarkBg)}
              title="Toggle Background"
            >
              {isDarkBg ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>


            <button 
              className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-3xl active:scale-90 transition-all duration-300 pointer-events-auto border ${isDarkBg ? 'bg-[#0d0d0d]/98 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.95)] hover:bg-white/5' : 'bg-black/40 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] hover:bg-white/10'}`}
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {isQueueOpen && (
        <div ref={listRef}>
          <AnimatedList
            items={queue}
            favorites={favorites}
            onItemSelect={handleItemSelect}
            handleRemove={handleRemove}
            currentVideoIndex={currentVideoIndex}
            progress={played}
            setFavorites={setFavorites}
            handleClearQueue={handleClearQueue}
            playlists={playlists}
            setPlaylists={setPlaylists}
          />
        </div>
      )}

      <Play
        queue={queue}
        favorites={favorites}
        setFavorites={setFavorites}
        addVideoToQueue={addVideoToQueue}
        currentVideoIndex={currentVideoIndex}
        setCurrentVideoIndex={setCurrentVideoIndex}
        setQueue={setQueue}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        played={played}
        setPlayed={setPlayed}
        setIsQueueOpen={setIsQueueOpen}
        playlists={playlists}
        setPlaylists={setPlaylists}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleClearQueue={handleClearQueue}
        isDarkBg={isDarkBg}
        setIsDarkBg={setIsDarkBg}
        autoBookmark={autoBookmark}
        setAutoBookmark={setAutoBookmark}
      />
    </>
  );
}