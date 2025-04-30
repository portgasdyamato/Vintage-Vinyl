import React from 'react';
import add from '../assets/add.png';

export default function Add({ handleAddVideo }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative w-28 h-28 transform transition-transform duration-150 active:scale-75 cursor-pointer"
        onClick={handleAddVideo} // Call the add video function on click
      >
        <img
          src={add} // Use the add icon
          alt="Add Video Button"
          className="w-full h-full rounded-full"
        />
      </div>
    </div>
  );
}
