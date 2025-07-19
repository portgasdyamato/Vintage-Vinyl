import React, { useState, useEffect, useRef } from 'react';
import '../App.css';
import play from '../assets/play.png';
import stop from '../assets/stop.png';
import disk from '../assets/disk.png';
import fallbackImage from '../assets/dk.jpeg';
import Tonearm from './Tonearm';
import ReactPlayer from 'react-player';
import Repeat from './Repeat';
import Next from './Next';
import board from '../assets/board.png'; // Import the board image
import Back from './Back';
import InputBox from './InputBox';
import Clear from './Clear';
import Add from './Add';
import Disk from './Disk';
import dw from '../assets/dw.png';

export default function Play({
  queue = [],
  addVideoToQueue,
  currentVideoIndex,
  setCurrentVideoIndex,
  setQueue,
  played,
  setPlayed,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [newVideoLink, setNewVideoLink] = useState(''); // Input for new video link
  const [isRepeat, setIsRepeat] = useState(false); // State to track repeat mode
  const playerRef = useRef(null);

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
    playerRef.current.seekTo(progress); // Seek to the new progress
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen top-13">
      {/* Board image in original position */}
      <div>
        <img
          src={board}
          alt=""
          className="absolute top-5 left-7"
          style={{ width: '25%', height: '85%' }}
        />
      </div>
      {/* Controls Grid absolutely positioned over board */}
      <div className="absolute top-0 left-6 z-10 flex flex-col items-center justify-center" style={{ width: '25%', height: '85%' }}>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[220px] h-[420px] flex flex-col items-center justify-center">
          <div className="grid grid-cols-2 grid-rows-4 gap-x-15 gap-y-8 w-full h-full items-center justify-center">
            {/* Row 1 */}
            <button className="flex items-center justify-center  w-27 h-20 rounded-full bg-transparent p-0  focus:outline-none" style={{ marginLeft: '-13px' }}  onClick={async () => {
              if (newVideoLink.trim() !== '') {
                const isPlaylist = newVideoLink.includes('list=');
                if (isPlaylist) {
                  const playlistId = extractPlaylistId(newVideoLink);
                  if (playlistId) {
                    const videos = await fetchPlaylistVideos(playlistId);
                    if (videos.length > 0) {
                      const updatedQueue = videos.map((video) => ({
                        url: `https://www.youtube.com/watch?v=${video.videoId}`,
                        title: video.title,
                      }));
                      setQueue((prevQueue) => [...prevQueue, ...updatedQueue]);
                      setCurrentVideoIndex(queue.length);
                      setIsPlaying(true);
                    } else {
                      alert('No videos found in the playlist.');
                    }
                  } else {
                    alert('Invalid playlist link.');
                  }
                } else {
                  const videoId = extractVideoId(newVideoLink);
                  if (videoId) {
                    const title = await fetchVideoTitle(videoId);
                    addVideoToQueue({ url: newVideoLink, title });
                    setCurrentVideoIndex(queue.length);
                    setIsPlaying(true);
                  } else {
                    alert('Invalid video link.');
                  }
                }
                setNewVideoLink('');
              } else if (queue.length > 0) {
                setIsPlaying(!isPlaying);
              } else {
                alert('Please enter a valid YouTube link or add videos to the queue.');
              }
            }}>
              <img src={isPlaying ? stop : play} alt={isPlaying ? 'Stop Button' : 'Play Button'} className="w-full h-full object-contain " />
            </button>
            <button className="flex items-center justify-center w-18 h-20 rounded-full bg-transparent p-0  focus:outline-none" onClick={() => setIsRepeat(!isRepeat)}>
              <Repeat isRepeat={isRepeat} />
            </button>
            {/* Row 2 */}
            <button className="flex items-center justify-center w-18 h-20 rounded-full bg-transparent p-0 focus:outline-none" onClick={() => setCurrentVideoIndex((prev) => (prev === 0 ? queue.length - 1 : prev - 1))}>
              <Back />
            </button>
            <button className="flex items-center justify-center w-18 h-20 rounded-full bg-transparent p-0 focus:outline-none" onClick={() => {
              if (queue.length > 0) {
                setCurrentVideoIndex((prev) => (prev + 1) % queue.length);
              }
            }}>
              <Next />
            </button>
            {/* Row 3 */}
            <button className="flex items-center justify-center w-18 h-20 rounded-full bg-transparent p-0 focus:outline-none" onClick={handleAddVideo}>
              <Add />
            </button>
            <button className="flex items-center justify-center w-18 h-20 rounded-full bg-transparent p-0 focus:outline-none" onClick={handleClearQueue}>
              <Clear />
            </button>
            <div></div> {/* Empty cell for spacing */}
            {/* Row 4 */}

            <button className="flex items-center justify-center w-25 h-20 rounded-full bg-transparent p-0 focus:outline-none" style={{ marginLeft: '-11px' }} onClick={() => {
              const url = queue[currentVideoIndex]?.url;
              if (url) {
                window.open(`http://localhost:3001/download?url=${encodeURIComponent(url)}`, '_blank');
              } else {
                alert('No song is currently playing.');
              }
            }} title="Download MP3 of current song">
              <img src={dw} alt="Download MP3" className="w-full h-full object-contain" />
            </button>
          </div>
        </div>
      </div>

      {/* Input for Adding Videos */}
      <div className="absolute bottom-35 left-19 z-50">
        <InputBox
          newVideoLink={newVideoLink}
          setNewVideoLink={setNewVideoLink}
        />
      </div>

      {/* Disk */}
      <Disk
        isPlaying={isPlaying}
        videoUrl={queue[currentVideoIndex]?.url || ''}
        onSeek={handleSeek} // Pass the seek handler
        played={played} // Pass the current progress
      />

      {/* ReactPlayer */}
      {queue.length > 0 && (
        <ReactPlayer
          ref={playerRef}
          url={queue[currentVideoIndex]?.url} // Play the current video
          playing={isPlaying}
          onProgress={({ played }) => setPlayed(played)} // Update progress
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

      {/* Tonearm */}
      <Tonearm isPlaying={isPlaying} />
    </div>
  );
}