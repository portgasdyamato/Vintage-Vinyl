import React, { useState, useEffect } from 'react';
import '../App.css';
import play from '../assets/play.png';
import stop from '../assets/stop.png';
import Disk from './Disk';
import Tonearm from './Tonearm';
import ReactPlayer from 'react-player';
import Repeat from './Repeat';
import Next from './Next';
import board from '../assets/board.png'; // Import the board image
import Back from './Back';
import InputBox from './InputBox';
import Clear from './Clear';
import Add from './Add';

export default function Play({
  queue = [],
  addVideoToQueue,
  currentVideoIndex,
  setCurrentVideoIndex,
  setQueue, // Add setQueue as a prop to modify the queue
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [newVideoLink, setNewVideoLink] = useState(''); // Input for new video link
  const [isRepeat, setIsRepeat] = useState(false); // State to track repeat mode

  useEffect(() => {
    if (queue.length > 0) {
      setIsPlaying(true); // Start playing when a new video is selected
    }
  }, [queue, setIsPlaying, currentVideoIndex]);

  const extractVideoId = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/.*v=|youtu\.be\/)([^&\s]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchVideoTitle = async (videoId) => {
    const apiKey = 'YOUR_YOUTUBE_API_KEY'; // Replace with your YouTube Data API key
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

  const handleAddVideo = () => {
    if (newVideoLink.trim() !== '') {
      const songNumber = queue.length + 1; // Generate the song number based on the queue length
      const title = `Song ${songNumber}`; // Create the title dynamically
      addVideoToQueue({ url: newVideoLink, title }); // Add the video to the queue with the dynamic title
      setNewVideoLink(''); // Clear the input field
    } else {
       // Show alert if the input box is empty
    }
  };

  const handleClearQueue = () => {
    setQueue([]); // Clear the queue
    setIsPlaying(false); // Stop playback
    setCurrentVideoIndex(0); // Reset the current video index
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen top-13">
      <div>
        <img
          src={board}
          alt=""
          className="absolute top-5 left-7"
          style={{ width: '25%', height: '85%' }}
        />
      </div>
      <div className="absolute top-20 left-18">
      <img
    src={isPlaying ? stop : play} // Toggle image based on state
    alt={isPlaying ? 'Stop Button' : 'Play Button'}
    className="w-28 h-28 transform transition-transform duration-150 active:scale-75"
    onClick={() => {
      if (newVideoLink.trim() !== '') {
        const songNumber = queue.length + 1; // Generate the song number based on the queue length
        const title = `Song ${songNumber}`; // Create the title dynamically
        addVideoToQueue({ url: newVideoLink, title }); // Add the video to the queue
        setCurrentVideoIndex(queue.length); // Set the new video as the current video
        setNewVideoLink(''); // Clear the input field
        setIsPlaying(true); // Start playback
      } else if (queue.length > 0) {
        setIsPlaying(!isPlaying); // Toggle play/pause if the queue is not empty
      } else {
         // Show alert if no song in queue and no link in input box
      }
    }}
  />
      </div>

      {/* Input for Adding Videos */}
      <div className="absolute bottom-35 left-19">
        <InputBox
          newVideoLink={newVideoLink}
          setNewVideoLink={setNewVideoLink}
          handleAddVideo={handleAddVideo} // Pass the add video handler
        />
      </div>
      <div className="absolute top-20 left-58">
        <Repeat isRepeat={isRepeat} handleRepeatToggle={() => setIsRepeat(!isRepeat)} />
      </div>

      {/* Back Button */}
      <div className="absolute top-60 left-18">
        <Back handleBackClick={() => setCurrentVideoIndex((prev) => (prev === 0 ? queue.length - 1 : prev - 1))} />
      </div>

      {/* Next Button */}
      <div className="absolute top-60 left-58">
        <Next handleNextClick={() => setCurrentVideoIndex((prev) => (prev + 1) % queue.length)} />
      </div>

      {/* Clear Button */}
      <div className="absolute top-100 left-58">
        <Clear handleClearQueue={handleClearQueue} />
      </div>
      <div className="absolute top-100 left-19">
        <Add handleAddVideo={handleAddVideo} /> {/* Pass the add video handler */}
      </div>

      {/* ReactPlayer */}
      {queue.length > 0 && (
        <ReactPlayer
          url={queue[currentVideoIndex]?.url} // Play the current video
          playing={isPlaying}
          controls
          onEnded={() => {
            if (isRepeat) {
              setIsPlaying(false); // Stop playback momentarily
              setTimeout(() => setIsPlaying(true), 10); // Replay the current song
            } else if (currentVideoIndex < queue.length - 1) {
              setCurrentVideoIndex((prev) => prev + 1); // Play the next song
            } else {
              setIsPlaying(false); // Stop playback when the last song ends
              setCurrentVideoIndex(0); // Reset to the first video
            }
          }}
          width="0"
          height="0"
        />
      )}

      {/* Disk */}
      <Disk isPlaying={isPlaying} videoUrl={queue[currentVideoIndex]?.url || ''} />

      {/* Tonearm */}
      <Tonearm isPlaying={isPlaying} />
    </div>
  );
}