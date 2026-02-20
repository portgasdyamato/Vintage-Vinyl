import React from 'react';
import dl from '../assets/dl.png';

export default function Clear({ handleClearQueue }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        className="w-full h-full transform transition-transform duration-150 active:scale-75 cursor-pointer"
      >
        <img
          src={dl}
          alt="Clear"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
