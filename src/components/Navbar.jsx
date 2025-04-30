import React, { useState } from 'react';
import pippofy from '../assets/pippofy.png';
import menu from '../assets/menu.png';
import Play from './Play';
import AnimatedList from './Queue';

export default function Navbar() {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [queue, setQueue] = useState([]); // State for the queue
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // Track the current video index
  const [isPlaying, setIsPlaying] = useState(false); // Track playback state

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
    if (index === currentVideoIndex) {
      setCurrentVideoIndex(0); // Reset to the first video
      setIsPlaying(false); // Stop playback
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
            <img
              src={menu}
              alt="Menu"
              className="h-14 w-18 transition-transform duration-150 active:scale-75 cursor-pointer"
              onClick={toggleQueue} // Toggle queue visibility
            />
          </div>
        </div>
      </nav>

      {isQueueOpen && (
        <div className="fixed top-20 right-[-50px] w-1/3 h-full z-20">
          <AnimatedList
            items={queue} // Pass the queue dynamically
            onItemSelect={handleItemSelect} // Pass the item selection handler
            handleRemove={handleRemove} // Pass the handleRemove function
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
      />
    </>
  );
}