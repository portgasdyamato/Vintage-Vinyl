import React from 'react';
import add from '../assets/add.png';

export default function Add({ handleAddVideo }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        className="w-full h-full transform transition-transform duration-150 active:scale-75 cursor-pointer"
      >
        <img
          src={add}
          alt="Add"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
