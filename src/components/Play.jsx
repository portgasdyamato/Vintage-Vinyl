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

export default function Play({
  queue = [],
  addVideoToQueue,
  currentVideoIndex,
  setCurrentVideoIndex,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [newVideoLink, setNewVideoLink] = useState(''); // Input for new video link
  const [isRepeat, setIsRepeat] = useState(false); // State to track repeat mode

  useEffect(() => {
    if (queue.length > 0) {
      setIsPlaying(true); // Start playing when a new video is selected
    }
  }, [currentVideoIndex]);

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

  const handleAddVideo = async () => {
    if (newVideoLink.trim() !== '') {
      const videoId = extractVideoId(newVideoLink);
      if (videoId) {
        const title = await fetchVideoTitle(videoId);
        // Add the video with its title to the queue
        addVideoToQueue({ url: newVideoLink, title });
        setNewVideoLink(''); // Clear the input field
      } else {
        alert('Invalid YouTube URL');
      }
    }
  };

  const handleNextClick = () => {
    // Move to the next video in the queue
    if (queue.length > 0) {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % queue.length);
      setIsPlaying(true); // Automatically play the next video
    }
  };

  const handleBackClick = () => {
    // Move to the previous video in the queue
    if (queue.length > 0) {
      setCurrentVideoIndex((prevIndex) =>
        prevIndex === 0 ? queue.length - 1 : prevIndex - 1
      );
      setIsPlaying(true); // Automatically play the previous video
    }
  };

  const handleRepeatToggle = () => {
    setIsRepeat(!isRepeat); // Toggle repeat mode
  };

  const resetAll = () => {
    setIsPlaying(false); // Stop playback
    setCurrentVideoIndex(0); // Reset to the first video
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen top-15">
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
          onClick={() => {setIsPlaying(!isPlaying); handleAddVideo();}} // Toggle play/pause on click
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
        <Repeat isRepeat={isRepeat} handleRepeatToggle={handleRepeatToggle} />
      </div>

      {/* Back Button */}
      <div className="absolute top-60 left-18">
        <Back handleBackClick={handleBackClick} />
      </div>

      {/* Next Button */}
      <div className="absolute top-60 left-58">
        <Next handleNextClick={handleNextClick} />
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
              handleNextClick(); // Play the next song
            } else {
              setIsPlaying(false); // Stop playback when the last song ends
              resetAll(); // Reset everything
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