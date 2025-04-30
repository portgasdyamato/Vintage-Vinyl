import React from 'react';
import rem from '../assets/rem.png'; // Import the remove image

function Remove({ onClick }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative transform transition-transform duration-150 active:scale-75 cursor-pointer"
        onClick={onClick} // Call the onClick function passed as a prop
      >
        <img
          src={rem}
          alt="Remove Button"
          className="w-10 h-10 rounded-lg"
        />
      </div>
    </div>
  );
}

export default Remove;