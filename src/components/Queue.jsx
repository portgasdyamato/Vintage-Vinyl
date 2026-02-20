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
  favorites = [],
  onItemSelect,
  handleRemove,
  currentVideoIndex = 0,
  progress = 0,
  setFavorites,
  className = '',
  itemClassName = '',
}) => {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'favorites'

  const listItems = activeTab === 'queue' ? items : favorites;

  const toggleFavorite = (e, item) => {
    e.stopPropagation();
    const isFav = favorites.some(f => f.url === item.url);
    if (isFav) {
      setFavorites(favorites.filter(f => f.url !== item.url));
    } else {
      setFavorites([...favorites, item]);
    }
  };
  return (
    <div
      className="fixed inset-0 sm:inset-auto sm:top-24 sm:right-8 z-[200] sm:w-[420px] pointer-events-none flex items-center justify-center sm:block p-6 sm:p-0"
    >
      {/* Glassmorphism Container - Dark Theme */}
      <div className="backdrop-blur-3xl bg-black/60 border border-white/10 rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col w-full max-h-[75vh] sm:max-h-[600px] overflow-hidden pointer-events-auto transform transition-all duration-700 animate-slide-in">
        
        <div className="w-full px-8 py-6 border-b border-white/5 flex flex-col gap-4 bg-white/5">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h2 className="text-[#b88c5a] font-medium text-xs uppercase tracking-[0.3em]">{activeTab}</h2>
              <p className="text-white/40 text-[10px] uppercase font-bold mt-1">
                {activeTab === 'queue' ? 'Up Next' : 'Your Collection'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/20 text-[10px] font-bold uppercase tracking-tighter">{listItems.length} tracks</span>
              <div className="w-2 h-2 rounded-full bg-[#b88c5a] animate-pulse shadow-[0_0_8px_#b88c5a]" />
            </div>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'queue' ? 'bg-white/10 text-[#b88c5a] shadow-lg' : 'text-white/30 hover:text-white/50'}`}
            >
              Queue
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'favorites' ? 'bg-white/10 text-[#b88c5a] shadow-lg' : 'text-white/30 hover:text-white/50'}`}
            >
              Favorites
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex flex-col gap-y-2 scroll-smooth scrollbar-hide p-6 w-full">
          {listItems.length === 0 ? (
            <div className="flex flex-col flex-1 min-h-[30vh] w-full justify-center items-center gap-6 text-center py-10">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                 <svg className="w-10 h-10 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/>
                 </svg>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-white/60 font-medium tracking-wide">
                  {activeTab === 'queue' ? 'Queue is empty' : 'No favorites yet'}
                </p>
                <p className="text-white/20 text-xs uppercase tracking-widest font-bold">
                  {activeTab === 'queue' ? 'Add some tunes' : 'Heart a song to save it'}
                </p>
              </div>
            </div>
          ) : (
            listItems.map((item, index) => {
              const isCurrent = activeTab === 'queue' && index === currentVideoIndex;
              const isFav = favorites.some(f => f.url === item.url);
              const thumbnail = getYouTubeThumbnail(item.url);
              const progressPercent = Math.max(0, Math.min(1, progress)) * 100;
              
              return (
                <AnimatedItem
                  key={index}
                  index={index}
                  onClick={() => onItemSelect(item, activeTab, index)}
                >
                  <div
                    className={`
                      flex items-center gap-4 p-4 w-full rounded-2xl transition-all duration-500
                      ${isCurrent ? 'bg-white/10 shadow-2xl scale-[1.02] border border-white/20' : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5'}
                      cursor-pointer group relative overflow-hidden
                    `}
                  >
                    {/* Progress Background */}
                    {isCurrent && (
                      <div 
                        className="absolute inset-0 bg-[#b88c5a]/10 pointer-events-none transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      />
                    )}

                    {/* Thumbnail */}
                    <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-2xl border ${isCurrent ? 'border-[#b88c5a] rotate-3' : 'border-white/10 group-hover:border-white/20'}`}>
                      {thumbnail ? (
                        <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        item.isLocal ? (
                          <div className="w-full h-full bg-[#b88c5a]/20 flex items-center justify-center text-[10px] text-[#b88c5a] font-bold">MP3</div>
                        ) : (
                          <div className="w-full h-full bg-black/10 flex items-center justify-center text-[10px] text-white/20">NO IMG</div>
                        )
                      )}
                      {isCurrent && (
                        <div className="absolute inset-0 bg-[#b88c5a]/20 flex items-center justify-center">
                          <div className="w-1 h-3 bg-white rounded-full animate-bounce mx-0.5" />
                          <div className="w-1 h-5 bg-white rounded-full animate-bounce [animation-delay:0.2s] mx-0.5" />
                          <div className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s] mx-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Song Title */}
                    <div className="flex-1 min-w-0 pr-2">
                      <p className={`text-[13px] font-medium leading-tight line-clamp-2 transition-colors duration-300 ${isCurrent ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                        {item.title}
                      </p>
                      {activeTab === 'favorites' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">My Favorites</span>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-[#b88c5a] font-bold uppercase tracking-widest text-[#b88c5a]">Playing</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isFav ? 'text-red-500 bg-red-500/10' : 'text-white/10 hover:text-white/30'}`}
                        onClick={e => toggleFavorite(e, item)}
                        title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                      
                      {activeTab === 'queue' && (
                        <button
                          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all text-white/10 group-hover:text-white/30"
                          onClick={e => {
                            e.stopPropagation();
                            handleRemove(index);
                          }}
                          aria-label="Remove"
                        >
                          <Remove className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
