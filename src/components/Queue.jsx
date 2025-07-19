import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import rem from '../assets/rem.png'; 
import Remove from './Remove';
import menu from '../assets/menu.png';

// Helper to get YouTube thumbnail
const getYouTubeThumbnail = (url) => {
  if (!url) return null;
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/.*v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
};

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, triggerOnce: false });
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      className="cursor-pointer"
    >
      {children}
    </motion.div>
  );
};

const AnimatedList = ({
  items = [],
  onItemSelect,
  handleRemove,
  currentVideoIndex = 0, // highlight current
  progress = 0, // NEW: progress of current song (0 to 1)
  className = '',
  itemClassName = '',
}) => {
  return (
    <div
      className="fixed top-32 right-8 z-50 w-[420px] max-w-[98vw] p-0 bottom-5"
      style={{
        transition: 'box-shadow 0.3s, background 0.3s',
      }}
    >
      {/* Glassmorphism Container */}
      <div className="backdrop-blur-xl bg-white/30 border border-white/30 rounded-3xl shadow-2xl px-10 flex flex-col items-center justify-center min-h-[70vh] overflow-visible" style={{boxShadow:'0 8px 32px 0 rgba(31, 38, 135, 0.37)', margin: '18px', paddingTop: '32px', paddingBottom: '32px'}}>
        <div className="max-h-[60vh] overflow-y-auto flex flex-col items-center gap-y-4 scrollbar-hide py-2 pb-16 overflow-visible w-full">
          {items.length === 0 ? (
            <div className="flex flex-1 min-h-[60vh] w-full justify-center items-center">
              <div className="text-center text-gray-600 py-8 rounded-xl  font-semibold">
                No songs in queue
              </div>
            </div>
          ) : (
            items.map((item, index) => {
              const isCurrent = index === currentVideoIndex;
              const thumbnail = getYouTubeThumbnail(item.url);
              const isFirst = index === 0;
              const isLast = index === items.length - 1;
              // Dynamic background for current item
              const progressPercent = Math.max(0, Math.min(1, progress)) * 100;
              const background = isCurrent
                ? `linear-gradient(90deg, rgba(183, 150, 97, 0.56) ${progressPercent}%, rgba(255,255,255,0.0) ${progressPercent}%)`
                : undefined;
              return (
                <AnimatedItem
                  key={index}
                  index={index}
                  onClick={() => onItemSelect(index)}
                >
                  <div
                    className={`
                      flex items-center gap-4 py-3 w-90 mx-auto my-3 rounded-2xl transition-all duration-200
                      shadow-sm bg-rose-500/10 hover:bg-[#eccdcd]/80 cursor-pointer
                      ${isCurrent ? 'shadow-xl shadow-black/20 border-0.9 border-black/20 border-l-8 border-fuchsia-500 relative' : ''}
                    `}
                    style={{
                      minHeight: '64px',
                      border: isCurrent ? '1px solid pink' : '1px solid #e0e0e0',
                      borderBottomLeftRadius: '16px',
                      borderBottomRightRadius: '16px',
                      zIndex: isCurrent ? 2 : 1,
                      backgroundImage: background,
                      ...(isCurrent ? { borderLeft: 'none' } : {}),
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="flex items-center">
                       <div className="w-2"></div>
                        <div className={`flex-shrink-0 w-12 h-12 mr-3 rounded-full overflow-hidden bg-gray-200 border-2 shadow-md flex items-center justify-center ${isCurrent ? 'border-pink-700' : 'border-[#b88c5a]'}`}>
                          {thumbnail ? (
                            <img src={thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                          )}
                        </div>
                    </div>
                    {/* Song Title */}
                    <p className={`text-gray-800 text-base font-normal font-sans flex-1 text-left break-words ${isCurrent ? 'text-[#b88c5a]' : ''}`}
                      style={{letterSpacing:'0.01em', fontWeight: 400}}>
                      {item.title}
                    </p>
                    {/* Remove Button */}
                    <button
                      className="flex items-center justify-center w-10 h-10 ml-2 rounded-full hover:bg-[#ffe6e0] transition"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                      tabIndex={-1}
                      aria-label="Remove"
                      type="button"
                    >
                      <Remove className="w-6 h-6 text-gray-400 hover:text-rose-400 transition" />
                    </button>
                    {/* Absolute left border overlay for current item */}
                    {isCurrent && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '13px',
                        borderTopLeftRadius: '16px',
                        borderBottomLeftRadius: '16px',
                        background: '#ad663d', // fuchsia-500
                        zIndex: 10,
                      }} />
                    )}
                  </div>
                </AnimatedItem>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimatedList;
