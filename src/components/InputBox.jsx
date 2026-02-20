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
        placeholder="Drop a YouTube video or playlist link here..."
        value={newVideoLink}
        onChange={(e) => setNewVideoLink(e.target.value)}
        onKeyDown={handleKeyPress}
        className="w-full bg-black/40 border border-white/10 text-white placeholder:text-white/30 rounded-full py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[#b88c5a]/50 backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
      />
    </div>
  );
}
