import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import disk from '../assets/disk.png';
import fallbackImage from '../assets/dk.jpeg';
import '../App.css';

const Disk = React.memo(function Disk({ isPlaying, videoUrl, onSeek, onScratch, played, duration = 180, isLocal = false }) {
  const diskRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRotation, setDragRotation] = useState(0);
  const [lastAngle, setLastAngle] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const isTouchDevice = useRef(false);
  
  const currentSecondsRef = useRef(0);
  const lastScratchTime = useRef(Date.now());
  const smoothVelocity = useRef(0);
  const SECONDS_PER_ROTATION = 20;

  const getYouTubeThumbnail = (url) => {
    if (!url || typeof url !== 'string' || url.startsWith('blob:') || url.startsWith('_capacitor_')) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  };

  const thumbnailUrl = getYouTubeThumbnail(videoUrl);

  const safeDuration = isFinite(duration) && duration > 0 ? duration : 180;
  const safePlayed = isFinite(played) ? played : 0;
  
  // Cleanly derive proper playback rotation visually 
  const playbackRotation = safePlayed * (safeDuration / SECONDS_PER_ROTATION) * 360;
  const currentVisualRotation = isDragging ? dragRotation : playbackRotation;

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
    return Math.atan2(point.y - centerY, point.x - centerX) * (180 / Math.PI);
  };

  const handleStart = (e) => {
    if (e.type === 'touchstart') isTouchDevice.current = true;
    if (e.type === 'mousedown' && isTouchDevice.current) return;

    setIsDragging(true);
    setDragRotation(playbackRotation);
    setLastAngle(calculateAngle(getEventPoint(e)));
    const currentPos = safePlayed * safeDuration;
    currentSecondsRef.current = currentPos;
    setDisplaySeconds(currentPos);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    
    const point = getEventPoint(e);
    const currentAngle = calculateAngle(point);
    
    let delta = currentAngle - lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    setDragRotation(prev => prev + delta);
    setLastAngle(currentAngle);

    const timeChange = (delta / 360) * SECONDS_PER_ROTATION;
    let newSeconds = currentSecondsRef.current + timeChange;
    
    if (newSeconds < 0) newSeconds = 0;
    if (newSeconds > safeDuration) newSeconds = safeDuration;
    
    currentSecondsRef.current = newSeconds; 
    setDisplaySeconds(newSeconds);

    // Calculate "Scratch" Velocity for real-time audio effects
    const now = Date.now();
    const dt = (now - lastScratchTime.current) / 1000;
    if (dt > 0.01) { 
      // Calculate raw velocity (rotations per second)
      const rawVelocity = delta / (dt * 360);
      
      // Apply Exponential Moving Average (EMA) for butter-smooth audio transitions
      // This eliminates the "weird" robotic jitter
      const alpha = 0.2; 
      smoothVelocity.current = (alpha * rawVelocity) + ((1 - alpha) * smoothVelocity.current);
      
      if (onScratch) onScratch(smoothVelocity.current * 8); // Slightly higher multiplier for better response
      lastScratchTime.current = now;
    }
  };

  const formatTime = (seconds) => {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnd = (e) => {
    if (e && e.type === 'mouseup' && isTouchDevice.current) return;
    if (isDragging) {
      setIsDragging(false);
      onSeek(currentSecondsRef.current / safeDuration);
      if (onScratch) onScratch(null); // Reset to normal
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center w-full touch-none select-none overflow-hidden"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      ref={diskRef}
    >
      <div
        className="relative"
        style={{
          width: 'min(85vw, 500px)',
          height: 'min(85vw, 500px)',
          transform: `rotate(${currentVisualRotation}deg)`,
          transition: isDragging ? 'none' : (isPlaying ? 'transform 1s linear' : 'transform 0.5s ease-out'),
          willChange: 'transform'
        }}
      >
        <img
          src={disk}
          alt="Disk"
          className="w-full h-full rounded-full bg-black pointer-events-none"
          style={{ objectFit: 'contain' }}
        />

        <div
          className="absolute"
          style={{
            width: '43%', 
            height: '43%',
            borderRadius: '50%',
            backgroundImage: `url(${thumbnailUrl || fallbackImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset 0 0 25px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 5
          }}
        >
        </div>
        {/* Constant Spindle Spoke */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border border-white/5 z-[10]" />
        
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.2)_100%)] pointer-events-none" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none" />
      </div>

      {/* Progress Jewel: Pop-up for YouTube, Always for Local */}
      <AnimatePresence>
        {(isLocal || isDragging) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 left-1/2 z-[120] pointer-events-none"
          >
            <div className="relative group scale-105 sm:scale-115">
              <div className="absolute inset-0 bg-[#b88c5a]/20 blur-3xl rounded-full animate-pulse-slow" />
              <div className="relative w-36 h-36 rounded-full border border-white/20 bg-black/40 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                <div className="flex flex-col items-center gap-0.5 relative z-10">
                  <span className="text-white/40 text-[9px] uppercase tracking-[0.3em] font-black mb-1">Seek</span>
                  <span className="text-white font-bold text-3xl tracking-tighter tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none italic">
                    {formatTime(isDragging ? displaySeconds : (safePlayed * safeDuration))}
                  </span>
                  <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-[#b88c5a]/60 to-transparent my-2" />
                  <span className="text-white/30 text-[10px] tabular-nums font-medium tracking-widest uppercase">
                    {formatTime(safeDuration)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default Disk;