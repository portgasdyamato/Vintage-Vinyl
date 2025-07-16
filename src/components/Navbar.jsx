import React, { useState, useRef, useEffect } from 'react';
import pippofy from '../assets/pippofy.png';
import menu from '../assets/menu.png';
import Play from './Play';
import AnimatedList from './Queue';

export default function Navbar() {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const listRef = useRef(null);
  const [isMenuClicked, setIsMenuClicked] = useState(false);
  const [queue, setQueue] = useState([]); // State for the queue
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // Track the current video index
  const [isPlaying, setIsPlaying] = useState(false); // Track playback state
  const [played, setPlayed] = useState(0); // Track the progress of the song (0 to 1)

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

  const handleItemSelect = (index) => {
    setCurrentVideoIndex(index); // Set the selected video as the current video
    setIsPlaying(true); // Start playback
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
      <nav className="fixed top-0 left-0 w-full h-15 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="font-bold flex items-center logo-hover">
            <img
              src={pippofy}
              alt="Pippofy Logo"
              className="h-14 w-28 mr-2"
            />
            <span className="text-white text-xl font-serif">Pippofy</span>
          </div>
          <div className="flex space-x-6">
            <button
              onClick={() => {
                setIsMenuClicked(true);
                setTimeout(() => setIsMenuClicked(false), 150);
                setIsQueueOpen((prev) => !prev);
              }}
              className={`bg-[#b88c5a] p-2 rounded-full mr-16 transition-all duration-150 flex items-center justify-center ${isMenuClicked ? 'scale-80' : ''}`}
              style={{ width: '75px', height: '75px' }}
              aria-label="Toggle song list menu"
            >
               <img src={menu} alt="Menu" className="w-26 h-26 object-contain" />
            </button>
          </div>
        </div>
      </nav>

      {isQueueOpen && (
        <div ref={listRef}>
          <AnimatedList
            items={queue}
            onItemSelect={handleItemSelect}
            handleRemove={handleRemove}
            currentVideoIndex={currentVideoIndex}
            progress={played}
          />
        </div>
      )}

      <Play
        queue={queue}
        addVideoToQueue={addVideoToQueue}
        currentVideoIndex={currentVideoIndex}
        setCurrentVideoIndex={setCurrentVideoIndex}
        setQueue={setQueue}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        played={played}
        setPlayed={setPlayed}
      />
    </>
  );
}