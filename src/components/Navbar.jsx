import React, { useState, useRef, useEffect } from 'react';
import pippofy from '../assets/pippofy.png';
import menu from '../assets/menu.png';
import Play from './Play';
import AnimatedList from './Queue';
import { Preferences } from '@capacitor/preferences';

export default function Navbar() {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const listRef = useRef(null);
  const [isMenuClicked, setIsMenuClicked] = useState(false);
  const [queue, setQueue] = useState([]); // State for the queue
  const [favorites, setFavorites] = useState([]); // State for favorites
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // Track the current video index
  const [isPlaying, setIsPlaying] = useState(false); // Track playback state
  const [played, setPlayed] = useState(0); // Track the progress of the song (0 to 1)
  const [playlists, setPlaylists] = useState([]); // State for user playlists
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state

  // Load favorites on mount
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
      const existingIndex = queue.findIndex(q => q.url === item.url);
      if (existingIndex !== -1) {
        setCurrentVideoIndex(existingIndex);
      } else {
        // Atomic update: calculate new index based on previous queue
        setQueue(prev => {
          const newQueue = [...prev, item];
          setCurrentVideoIndex(newQueue.length - 1);
          return newQueue;
        });
      }
    } else {
      setCurrentVideoIndex(index);
    }
    setIsPlaying(true);
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
          <div className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:opacity-80">
            <img
              src={pippofy}
              alt="Pippofy"
              className="h-10 w-auto sm:h-12"
            />
            <span className="text-white text-lg sm:text-2xl font-serif font-bold tracking-[0.1em] uppercase leading-none">Pippofy</span>
          </div>

          <button 
            className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-all duration-300"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
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
      />
    </>
  );
}