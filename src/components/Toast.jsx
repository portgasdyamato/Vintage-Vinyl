import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 2000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  const onCloseRef = React.useRef(onClose);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onCloseRef.current(), 300); // Wait for fade out animation before unmounting
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  if (!message && !isVisible) return null;

  return (
    <div className={`fixed top-12 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ease-in-out pointer-events-none filter shadow-[0_20px_40px_rgba(0,0,0,0.9)] ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}>
      <div className="bg-[#1a1a1a] border border-[#b88c5a]/40 rounded-2xl px-8 py-4 flex items-center justify-center overflow-hidden relative min-w-[280px]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b88c5a]/5 to-transparent w-[200%] animate-shimmer pointer-events-none" />
        <span className="text-white font-medium tracking-wide text-sm relative z-10 flex items-center justify-center gap-3 w-full">
            {type === 'success' && (
               <svg className="w-4 h-4 text-[#b88c5a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            )}
            {type === 'error' && (
               <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            )}
            {message}
        </span>
      </div>
    </div>
  );
};

export default Toast;
