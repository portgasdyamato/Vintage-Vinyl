import React from 'react';
import repeat from '../assets/repeat.png';
import repeaty from '../assets/repeaty.png'; // Import the active repeat image

export default function Repeat({ isRepeat, handleRepeatToggle }) {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div
                className="w-full h-full transform transition-transform duration-150 active:scale-75"
            >
                <img
                    src={isRepeat ? repeat : repeaty}
                    alt="Repeat"
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    );
}


