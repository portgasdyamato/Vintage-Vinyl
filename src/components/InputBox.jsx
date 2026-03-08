import React from 'react';
import '../App.css';

export default function InputBox({ newVideoLink, setNewVideoLink, onAdd }) {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
          onAdd(); // Trigger the add video function when Enter is pressed
        }
      };
  return (
    <div className="w-full">
      <input
        type="text"
        placeholder="YouTube, Spotify track / playlist / album link..."
        value={newVideoLink}
        onChange={(e) => setNewVideoLink(e.target.value)}
        onKeyDown={handleKeyPress}
        className="w-full bg-transparent text-white placeholder:text-white/30 rounded-full py-4 px-6 focus:outline-none focus:bg-white/5 transition-all duration-300 text-sm sm:text-base"
      />
    </div>
  );
}
