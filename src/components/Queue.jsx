import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// Helper to get YouTube thumbnail
const getYouTubeThumbnail = (url) => {
  if (!url) return null;
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/.*v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
};

const AnimatedItem = ({ children, index, onClick, onLongPress }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, triggerOnce: false });
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);

  const handlePointerDown = (e) => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress?.();
    }, 650);
  };

  const handlePointerUp = () => clearTimeout(longPressTimer.current);
  const handlePointerLeave = () => clearTimeout(longPressTimer.current);

  const handleClick = (e) => {
    if (didLongPress.current) { didLongPress.current = false; return; }
    onClick?.(e);
  };

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="cursor-pointer select-none"
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
  handleClearQueue,
  playlists = [],
  setPlaylists,
}) => {
  const [activeTab, setActiveTab] = useState('queue');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [showBulkPlaylistPicker, setShowBulkPlaylistPicker] = useState(false);
  const [bulkAddResult, setBulkAddResult] = useState(null);
  const containerRef = useRef(null);

  const listItems = activeTab === 'queue' ? items : favorites;
  const allSelected = listItems.length > 0 && selectedIndices.size === listItems.length;
  const someSelected = selectedIndices.size > 0 && !allSelected;

  const toggleFavorite = (e, item) => {
    e.stopPropagation();
    const isFav = favorites.some(f => f.url === item.url);
    setFavorites(isFav ? favorites.filter(f => f.url !== item.url) : [...favorites, item]);
  };

  const enterSelectionMode = useCallback((index) => {
    setSelectionMode(true);
    setSelectedIndices(new Set([index]));
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIndices(new Set());
  }, []);

  const toggleSelect = useCallback((index) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    setSelectedIndices(allSelected ? new Set() : new Set(listItems.map((_, i) => i)));
  };

  // Click‑outside to exit selection mode
  const handleOuterPointerDown = (e) => {
    if (selectionMode && containerRef.current && !containerRef.current.contains(e.target)) {
      exitSelectionMode();
    }
  };

  const handleBulkAdd = (playlistId) => {
    if (!setPlaylists) return;
    const selectedSongs = [...selectedIndices].map(i => listItems[i]).filter(Boolean);
    let added = 0, skipped = 0;
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      const existingUrls = new Set(p.songs.map(s => s.url));
      const newSongs = [];
      for (const song of selectedSongs) {
        if (existingUrls.has(song.url)) { skipped++; }
        else { newSongs.push(song); added++; existingUrls.add(song.url); }
      }
      return { ...p, songs: [...p.songs, ...newSongs] };
    }));
    setBulkAddResult({ added, skipped });
    setShowBulkPlaylistPicker(false);
    exitSelectionMode();
    setTimeout(() => setBulkAddResult(null), 3000);
  };

  return (
    <div
      className="fixed inset-0 sm:inset-auto sm:top-24 sm:right-8 z-[200] sm:w-[420px] pointer-events-none flex items-center justify-center sm:block p-6 sm:p-0"
      onPointerDown={handleOuterPointerDown}
    >
      <div
        ref={containerRef}
        className="backdrop-blur-3xl bg-[#0d0d0d]/98 border border-white/10 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.95)] flex flex-col w-full max-h-[80vh] sm:max-h-[650px] overflow-hidden pointer-events-auto relative animate-slide-in"
      >

        {/* ── Header — always the same, never invaded by selection controls ── */}
        <div className="w-full px-8 pt-6 pb-5 flex flex-col gap-4 bg-white/5">
          <div className="flex justify-between items-center">
            {/* Left: identity */}
            <div className="flex flex-col">
              <h2 className="text-[#b88c5a] font-medium text-xs uppercase tracking-[0.3em]">{activeTab}</h2>
              <p className="text-white/40 text-[10px] uppercase font-bold mt-1">
                {activeTab === 'queue' ? 'Up Next' : 'Your Collection'}
              </p>
            </div>

            {/* Right: track count / selection controls */}
            <div className="flex items-center gap-3">
              {/* Normal mode: trash + count + dot */}
              {!selectionMode && (
                <>
                  {activeTab === 'queue' && listItems.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                  <span className="text-white/20 text-[10px] font-bold uppercase tracking-tighter">{listItems.length} tracks</span>
                  <div className="w-2 h-2 rounded-full bg-[#b88c5a] animate-pulse shadow-[0_0_8px_#b88c5a]" />
                </>
              )}

              {/* Selection mode: checkbox + count + Add */}
              {selectionMode && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="sel-controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2.5"
                  >
                    {/* Checkbox + All label */}
                    <button className="flex items-center gap-1.5 group" onClick={toggleSelectAll}>
                      <div className={`w-[15px] h-[15px] rounded-[4px] border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        allSelected ? 'bg-[#b88c5a] border-[#b88c5a]'
                        : someSelected ? 'border-[#b88c5a]/60 bg-[#b88c5a]/10'
                        : 'border-white/25 group-hover:border-[#b88c5a]/55'
                      }`}>
                        {allSelected && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                        {someSelected && !allSelected && (
                          <div className="w-[7px] h-[1.5px] bg-[#b88c5a] rounded-full" />
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35 group-hover:text-white/65 transition-colors whitespace-nowrap">
                        {allSelected ? 'None' : 'All'}
                      </span>
                    </button>

                    {/* Separator dot */}
                    <div className="w-1 h-1 rounded-full bg-white/10" />

                    {/* Count */}
                    <span className="text-[10px] font-black text-[#b88c5a]/70 tabular-nums">{selectedIndices.size}</span>

                    {/* Add — text button, glows amber when active */}
                    <button
                      onClick={() => selectedIndices.size > 0 && setShowBulkPlaylistPicker(true)}
                      className={`text-[9px] font-black uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                        selectedIndices.size > 0 ? 'text-[#b88c5a] hover:text-[#d4a96a]' : 'text-white/15 cursor-default'
                      }`}
                    >
                      + Add
                    </button>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>


          {/* Tab Switcher — always visible */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => { setActiveTab('queue'); exitSelectionMode(); }}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'queue' ? 'bg-white/10 text-[#b88c5a] shadow-lg' : 'text-white/30 hover:text-white/50'}`}
            >Queue</button>
            <button
              onClick={() => { setActiveTab('favorites'); exitSelectionMode(); }}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'favorites' ? 'bg-white/10 text-[#b88c5a] shadow-lg' : 'text-white/30 hover:text-white/50'}`}
            >Favorites</button>
          </div>
        </div>

        {/* ── Bulk add success toast ── */}
        <AnimatePresence>
          {bulkAddResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-6 mt-3 px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {bulkAddResult.added} added{bulkAddResult.skipped > 0 ? `, ${bulkAddResult.skipped} already in playlist` : ''}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hint ── */}
        {selectionMode && (
          <p className="px-8 pt-2.5 pb-0 text-white/20 text-[9px] uppercase tracking-[0.2em] font-bold">
            <span className="text-[#b88c5a]/60 font-black">{selectedIndices.size}</span>
            {' · Tap to select'}
          </p>
        )}


        {/* ── Song List ── */}
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
              const isSelected = selectedIndices.has(index);

              return (
                <AnimatedItem
                  key={index}
                  index={index}
                  onClick={() => {
                    if (selectionMode) toggleSelect(index);
                    else onItemSelect(item, activeTab, index);
                  }}
                  onLongPress={() => {
                    if (!selectionMode) enterSelectionMode(index);
                    else toggleSelect(index);
                  }}
                >
                  <div className={`
                    flex items-center gap-4 p-5 w-full rounded-[28px] transition-all duration-300
                    ${isSelected
                      ? 'bg-[#b88c5a]/12 border border-[#b88c5a]/35 shadow-[0_0_16px_rgba(184,140,90,0.1)]'
                      : isCurrent
                        ? 'bg-white/10 shadow-2xl scale-[1.02] border border-white/20'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/5'
                    }
                    cursor-pointer group relative overflow-hidden
                  `}>
                    {/* Progress bar for current song */}
                    {isCurrent && !isSelected && (
                      <div
                        className="absolute inset-0 bg-[#b88c5a]/10 pointer-events-none transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      />
                    )}

                    {/* Selection checkbox */}
                    {selectionMode && (
                      <div className={`flex-shrink-0 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-[#b88c5a] border-[#b88c5a]' : 'border-white/20 group-hover:border-[#b88c5a]/40'}`}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300 ${isSelected ? 'border-[#b88c5a]/50 scale-95' : isCurrent ? 'border-[#b88c5a] rotate-3' : 'border-white/10 group-hover:border-white/20'}`}>
                      {thumbnail ? (
                        <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : item.isLocal ? (
                        <div className="w-full h-full bg-[#b88c5a]/20 flex items-center justify-center text-[10px] text-[#b88c5a] font-bold">MP3</div>
                      ) : (
                        <div className="w-full h-full bg-black/10 flex items-center justify-center text-[10px] text-white/20">NO IMG</div>
                      )}
                      {isCurrent && !isSelected && (
                        <div className="absolute inset-0 bg-[#b88c5a]/20 flex items-center justify-center">
                          <div className="w-1 h-3 bg-white rounded-full animate-bounce mx-0.5" />
                          <div className="w-1 h-5 bg-white rounded-full animate-bounce [animation-delay:0.2s] mx-0.5" />
                          <div className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s] mx-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0 pr-2">
                      <p className={`text-[13px] font-medium leading-tight line-clamp-2 transition-colors duration-300 ${isSelected ? 'text-[#b88c5a]' : isCurrent ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                        {item.title}
                      </p>
                      {activeTab === 'favorites' && (
                        <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter mt-1 block">My Favorites</span>
                      )}
                      {isCurrent && !isSelected && (
                        <span className="text-[10px] text-[#b88c5a] font-bold uppercase tracking-widest mt-1.5 block">Playing</span>
                      )}
                    </div>

                    {/* Action buttons — hidden during selection */}
                    {!selectionMode && (
                      <div className="flex gap-1">
                        <button
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isFav ? 'text-red-500 hover:bg-red-500/10' : 'text-white/10 hover:text-white/30 hover:bg-white/5'}`}
                          onClick={e => toggleFavorite(e, item)}
                          title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                        {activeTab === 'queue' && (
                          <button
                            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all text-white/10 group-hover:text-white/40 active:scale-90"
                            onClick={e => { e.stopPropagation(); handleRemove(index); }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </AnimatedItem>
              );
            })
          )}
        </div>

        {/* ── Clear confirm ── */}
        {showConfirm && (
          <div className="absolute inset-0 bg-[#0a0a0a]/98 backdrop-blur-3xl z-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in rounded-[40px]">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60 mb-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <h3 className="text-white text-lg font-bold mb-2">Clear Queue?</h3>
            <p className="text-white/50 text-xs mb-8">This will remove all upcoming tracks. This action cannot be undone.</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all">Cancel</button>
              <button onClick={() => { handleClearQueue(); setShowConfirm(false); }} className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest transition-all">Clear All</button>
            </div>
          </div>
        )}

        {/* ── Bulk Playlist Picker — slides up as a bottom sheet ── */}
        <AnimatePresence>
          {showBulkPlaylistPicker && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-b-[40px] rounded-t-[28px] overflow-hidden"
              style={{ background: 'rgba(14,12,10,0.99)', backdropFilter: 'blur(40px)', maxHeight: '75%' }}
            >
              {/* Sheet handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              {/* Title row */}
              <div className="flex items-center justify-between px-7 py-4 flex-shrink-0 border-b border-white/[0.06]">
                <div>
                  <p className="text-white font-bold text-[15px] tracking-wide">Add to Playlist</p>
                  <p className="text-white/30 text-[10px] mt-0.5">{selectedIndices.size} song{selectedIndices.size !== 1 ? 's' : ''} selected</p>
                </div>
                <button
                  onClick={() => setShowBulkPlaylistPicker(false)}
                  className="text-white/30 hover:text-white/70 transition-colors p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Playlist rows */}
              <div className="flex-1 overflow-y-auto scrollbar-hide py-3">
                {playlists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <p className="text-white/20 text-xs uppercase tracking-widest font-bold">No playlists yet</p>
                    <p className="text-white/12 text-[10px]">Create one from Controls → Playlists</p>
                  </div>
                ) : (
                  playlists.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => handleBulkAdd(p.id)}
                      className="w-full flex items-center justify-between px-7 py-[14px] hover:bg-white/[0.04] active:bg-[#b88c5a]/8 transition-colors group"
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="text-white/80 group-hover:text-white font-semibold text-[14px] transition-colors">{p.name}</span>
                        <span className="text-white/20 text-[10px] mt-0.5">{p.songs?.length || 0} tracks</span>
                      </div>
                      <svg className="text-white/15 group-hover:text-[#b88c5a] transition-colors flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default AnimatedList;
