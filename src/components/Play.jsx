import { useState } from 'react';
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

export default function Play() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // Track the current video index
    const [videoQueue, setVideoQueue] = useState([]); // Queue of video URLs
    const [newVideoLink, setNewVideoLink] = useState(''); // Input for new video link
    const [isRepeat, setIsRepeat] = useState(false); // State to track repeat mode

    const handleClick = () => {
        if (newVideoLink.trim() !== '') {
            // Add the current link to the queue if it's not already present
            if (!videoQueue.includes(newVideoLink)) {
                setVideoQueue((prevQueue) => [...prevQueue, newVideoLink]);
            }
            setNewVideoLink(''); // Clear the input field
        }
        setIsPlaying(!isPlaying); // Toggle between play and stop
    };

    const handleNextClick = () => {
        // Move to the next video in the queue
        if (videoQueue.length > 0) {
            setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoQueue.length);
            setIsPlaying(true); // Automatically play the next video
        }
    };

    const handleBackClick = () => {
        // Move to the previous video in the queue
        if (videoQueue.length > 0) {
            setCurrentVideoIndex((prevIndex) =>
                prevIndex === 0 ? videoQueue.length - 1 : prevIndex - 1
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
        setVideoQueue([]); // Clear the queue
    };

    return (
        <div className="relative flex flex-col items-center justify-center h-screen top-15">
            
            <div><img src={board} alt="" className='absolute top-5 left-7' style={{ width: '25%', height: '85%' }}/></div>
            <div className="absolute top-20 left-18">
                <img
                    src={isPlaying ? stop : play} // Toggle image based on state
                    alt={isPlaying ? 'Stop Button' : 'Play Button'}
                    className="w-28 h-28 transform transition-transform duration-150 active:scale-75"
                    onClick={handleClick}
                />
            </div>

            {/* Input for Adding Videos */}
            <div className="absolute bottom-35 left-19">
                <input
                    type="text"
                    placeholder="Enter YouTube link"
                    value={newVideoLink}
                    onChange={(e) => setNewVideoLink(e.target.value)}
                    className="spotify-input mb-2"
                />
            </div>

            {/* Repeat Button */}
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
            {videoQueue.length > 0 && (
                <ReactPlayer
                    url={videoQueue[currentVideoIndex]} // Play the current video
                    playing={isPlaying}
                    controls
                    onEnded={() => {
                        if (isRepeat) {
                            setIsPlaying(false); // Stop playback momentarily
                            setTimeout(() => setIsPlaying(true), 10); // Replay the current song
                        } else if (currentVideoIndex < videoQueue.length - 1) {
                            handleNextClick(); // Play the next song
                        } else {
                            resetAll(); // Reset everything when the queue ends
                        }
                    }}
                    width="0"
                    height="0"
                />
            )}

            {/* Disk */}
            <Disk isPlaying={isPlaying} videoUrl={videoQueue[currentVideoIndex] || ''} />

            {/* Tonearm */}
            <Tonearm isPlaying={isPlaying} />
        </div>
    );
}