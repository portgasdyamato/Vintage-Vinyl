import React, { useRef, useState, useEffect } from 'react';
import disk from '../assets/disk.png';
import fallbackImage from '../assets/dk.jpeg';
import '../App.css';

export default function Disk({ isPlaying, videoUrl, onSeek, played, duration = 180 }) {
  const diskRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastAngle, setLastAngle] = useState(0);
  const [rotation, setRotation] = useState(0);

  // Constants
  const SECONDS_PER_ROTATION = 20; // 1 full spin = 20 seconds of the song

  // Extract YouTube video ID from the URL
  const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/) ||
                  url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  };

  const thumbnailUrl = getYouTubeThumbnail(videoUrl);

  const getEventPoint = (e) => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const calculateAngle = (point) => {
    if (!diskRef.current) return 0;
    const rect = diskRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = point.x - centerX;
    const deltaY = point.y - centerY;
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  };

  const handeStart = (e) => {
    const point = getEventPoint(e);
    setIsDragging(true);
    setLastAngle(calculateAngle(point));
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    
    const point = getEventPoint(e);
    const currentAngle = calculateAngle(point);
    
    let delta = currentAngle - lastAngle;
    
    // Handle wrap-around (-180 to 180)
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    const newRotation = rotation + delta;
    setRotation(newRotation);
    setLastAngle(currentAngle);

    // Calculate new progress based on rotation
    // totalRotationDegrees = (played * duration / SEC_PER_ROT) * 360
    const timeChange = (delta / 360) * SECONDS_PER_ROTATION;
    const currentSeconds = played * duration;
    let newSeconds = currentSeconds + timeChange;
    
    // Constraints
    if (newSeconds < 0) newSeconds = 0;
    if (newSeconds > duration) newSeconds = duration;

    onSeek(newSeconds / duration);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Sync rotation with song progress when not dragging
  useEffect(() => {
    if (!isDragging) {
      // Scale rotation based on played time
      const totalRotations = (played * (duration || 180)) / SECONDS_PER_ROTATION;
      setRotation(totalRotations * 360);
    }
  }, [played, isDragging, duration]);

  return (
    <div
      className="relative flex flex-col items-center justify-center w-full touch-none select-none"
      onMouseDown={handeStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handeStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      ref={diskRef}
    >
      <div
        className={`relative ${isPlaying && !isDragging ? 'rotating-disk' : ''}`}
        style={{
          width: 'min(85vw, 600px)',
          height: 'min(85vw, 600px)',
          transform: isDragging ? `rotate(${rotation}deg)` : (!isPlaying ? `rotate(${played * (duration || 180) * 18}deg)` : 'none'),
          transition: isDragging ? 'none' : 'transform 0.5s ease-out',
          willChange: 'transform'
        }}
      >
        {/* Disk Image */}
        <img
          src={disk}
          alt="Disk"
          className="w-full h-full rounded-full bg-black"
          style={{ objectFit: 'contain' }}
        />

        {/* Video Thumbnail Center */}
        <div
          className="absolute"
          style={{
            width: '36%', 
            height: '36%',
            borderRadius: '50%',
            backgroundImage: `url(${thumbnailUrl || fallbackImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)'
          }}
        >
          {/* Hole center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border border-white/5" />
        </div>
        
        {/* Vinyl Grooves & Reflection */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.2)_100%)] pointer-events-none" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none" />
      </div>
    </div>
  );
}