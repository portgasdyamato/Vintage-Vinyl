import React from 'react';
import dl from '../assets/dl.png';

export default function Clear({ handleClearQueue }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative w-28 h-28 transform transition-transform duration-150 active:scale-75 cursor-pointer"
        onClick={() => {
          console.log('Clear button clicked in Clear.jsx'); // Debugging log
          handleClearQueue();
        }}
      >
        <img
          src={dl}
          alt="Clear Queue Button"
          className="w-full h-full rounded-full"
        />
      </div>
    </div>
  );
}
