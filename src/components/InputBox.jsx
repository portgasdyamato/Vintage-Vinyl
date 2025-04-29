import React from 'react';
import '../App.css';

export default function InputBox({ newVideoLink, setNewVideoLink }) {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
          handleAddVideo(); // Trigger the add video function when Enter is pressed
        }
      };
  return (
    <div>
      <input
        type="text"
        placeholder="Enter YouTube link"
        value={newVideoLink}
        onChange={(e) => setNewVideoLink(e.target.value)}
        onKeyDown={handleKeyPress}
        className="spotify-input mb-2"
      />
    </div>
  );
}
