import React from 'react';
import repeat from '../assets/repeat.png';
import repeaty from '../assets/repeaty.png'; // Import the active repeat image

export default function Repeat({ isRepeat, handleRepeatToggle }) {
    return (
        <div className="flex flex-col items-center justify-center">
            <div
                className={`relative w-28 h-28 transform transition-transform duration-150 active:scale-75 `} // Add shadow when repeat is active
                onClick={handleRepeatToggle} // Toggle repeat mode on click
            >
                <img
                    src={isRepeat ? repeat : repeaty} // Change image based on repeat state
                    alt="Repeat Button"
                    className="w-full h-full rounded-full"
                />
            </div>
        </div>
    );
}


