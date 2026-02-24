import React from 'react';
import { motion } from 'framer-motion';
import pippofyLogo from '../assets/pippofy.png';

export default function MobileLanding() {
  const features = [
    { title: "Vinyl Experience", desc: "Tactile tonearm and disk scratching on your phone.", icon: "💿" },
    { title: "Atmosphere", desc: "Layer rain or forest sounds over any music.", icon: "🌊" },
    { title: "Smart Resume", desc: "Never lose your spot in YouTube videos again.", icon: "🕒" },
    { title: "Native High-Fi", desc: "Play your local high-quality audio files.", icon: "📱" }
  ];

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/Pippofy.Music.Player.apk';
    link.download = 'Pippofy Music Player.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#020202] text-white overflow-y-auto overflow-x-hidden font-sans">
      {/* Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#b88c5a]/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative px-8 pt-20 pb-20 flex flex-col items-center">
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-32 h-32 mb-8 relative"
        >
          <div className="absolute inset-0 bg-[#b88c5a]/20 rounded-full blur-2xl animate-pulse" />
          <img src={pippofyLogo} alt="Pippofy" className="relative w-full h-full object-contain" />
        </motion.div>

        {/* Hero Text */}
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-4xl font-black text-center mb-4 tracking-tight"
          style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
        >
          Music as an <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#f3e1cc] to-[#b88c5a]">Experience</span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-white/50 text-center text-sm leading-relaxed mb-12 max-w-[280px]"
        >
          Pippofy isn't just a player; it's a tactile journey through your sound library.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          onClick={handleDownload}
          className="w-full max-w-xs bg-gradient-to-b from-[#f3e1cc] to-[#b88c5a] text-black font-extrabold py-5 rounded-[22px] shadow-[0_20px_40px_rgba(184,140,90,0.3)] mb-4 active:scale-95 transition-transform"
        >
          Download Pippofy v1.3
        </motion.button>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-16 font-bold">Available for Android</p>

        {/* Features List */}
        <div className="w-full space-y-4">
          <p className="text-[10px] text-[#b88c5a] uppercase tracking-[0.4em] font-black text-center mb-8">Premium Features</p>
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.03] border border-white/5 p-5 rounded-[26px] flex items-center gap-5"
            >
              <span className="text-3xl grayscale-[0.5]">{f.icon}</span>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-white/40 text-[11px] leading-snug">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-24 text-center">
          <p className="text-white/20 text-[10px] uppercase tracking-widest leading-loose">
            Designed for those who<br/>truly love their music.
          </p>
          <div className="mt-6 flex justify-center gap-1 opacity-20">
            {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white"/>)}
          </div>
        </div>
      </div>
    </div>
  );
}
