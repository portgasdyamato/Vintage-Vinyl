import React, { useRef, useState, useEffect } from 'react';
import disk from '../assets/disk.png';
import fallbackImage from '../assets/dk.jpeg';
import '../App.css';

export default function Disk({ isPlaying, videoUrl, onSeek, played }) {
  const diskRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [rotation, setRotation] = useState(0); // Track the current rotation of the disk

  // Extract YouTube video ID from the URL
  const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/) ||
                  url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  };

  const thumbnailUrl = getYouTubeThumbnail(videoUrl);

  // Calculate the angle between the mouse and the center of the disk
  const calculateAngle = (e) => {
    const rect = diskRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Convert radians to degrees
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartAngle(calculateAngle(e) - rotation); // Adjust for current rotation
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const currentAngle = calculateAngle(e);
    const angleDifference = currentAngle - startAngle;

    const newRotation = rotation + angleDifference;
    setRotation(newRotation); // Update rotation
    setStartAngle(currentAngle); // Update the start angle for the next move

    // Map rotation to song progress (0 to 1)
    const progress = (newRotation % 360) / 360;
    onSeek(progress >= 0 ? progress : 1 + progress); // Handle negative rotation
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Sync rotation with song progress
  useEffect(() => {
    if (!isDragging) {
      setRotation(played * 360); // Map song progress (0 to 1) to rotation (0 to 360 degrees)
    }
  }, [played, isDragging]);

  return (
    <div
      className="relative flex flex-col items-center justify-center h-screen"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      ref={diskRef}
    >
      <div
        className={`relative bottom-15 left-5 ${isPlaying && !isDragging ? 'rotating-disk' : ''}`}
        style={{
          width: '700px',
          height: '700px',
          transform: `rotate(${rotation }deg)`, // Apply the rotation transform
          transition: isDragging ? 'none' : 'transform 0.1s linear', // Smooth transition when not dragging
        }}
      >
        {/* Disk Image */}
        <img
          src={disk}
          alt="Disk"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
          }}
        />

        {/* Video Thumbnail or Fallback Image */}
        <div
          className="absolute"
          style={{
            width: '255px',
            height: '250px',
            borderRadius: '50%',
            backgroundImage: `url(${thumbnailUrl || fallbackImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        ></div>
      </div>
    </div>
  );
}