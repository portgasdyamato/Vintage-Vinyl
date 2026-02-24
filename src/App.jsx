import React, { useEffect } from 'react';
import Play from './components/Play';
import Navbar from './components/Navbar';
import './App.css'; // Import the CSS file for styling
import bgVideo from './assets/bg.mp4'; // Import the background video
import darkBgVideo from './assets/darkbg.mp4'; // Import the dark background video
import pippofyLogo from './assets/pippofy.png'; // Import the branding logo
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { motion, AnimatePresence } from 'framer-motion';

import MobileLanding from './components/MobileLanding';
import { Capacitor } from '@capacitor/core';

export default function App() {
    const [isReady, setIsReady] = React.useState(false);
    const [isDarkBg, setIsDarkBg] = React.useState(false);
    const [isMobileWeb, setIsMobileWeb] = React.useState(false);
    const splashTimerRef = React.useRef(false);
    const initialMountRef = React.useRef(true);

    useEffect(() => {
        // Check if we should show the mobile landing page
        const checkPlatform = () => {
            const isNative = Capacitor.isNativePlatform();
            const isMobile = window.innerWidth <= 768;
            setIsMobileWeb(!isNative && isMobile);
        };
        checkPlatform();
        window.addEventListener('resize', checkPlatform);
        
        // Request permissions and hide native splash
        const init = async () => {
            if (Capacitor.isNativePlatform()) {
                const status = await LocalNotifications.checkPermissions();
                if (status.display !== 'granted') {
                    await LocalNotifications.requestPermissions();
                }
                await SplashScreen.hide();
            }
        };
        init();

        // Load background preference
        const loadBgPref = async () => {
            const { value } = await Preferences.get({ key: 'isDarkBg' });
            setIsDarkBg(value === 'true');
        };
        loadBgPref();

        // Safety Fallback: Ensure splash clears even if video takes too long to load
        const safetyTimeout = setTimeout(() => {
            if (!splashTimerRef.current) {
                splashTimerRef.current = true;
                setIsReady(true);
            }
        }, 6000); 

        return () => {
            clearTimeout(safetyTimeout);
            window.removeEventListener('resize', checkPlatform);
        };
    }, []);

    useEffect(() => {
        if (initialMountRef.current) {
            initialMountRef.current = false;
            return;
        }
        Preferences.set({ key: 'isDarkBg', value: isDarkBg.toString() });
    }, [isDarkBg]);

    // Handle video ready state
    const handleVideoReady = () => {
        if (!splashTimerRef.current) {
            splashTimerRef.current = true;
            // High-class duration: 4.5s of cinematic immersion
            setTimeout(() => setIsReady(true), 4500); 
        }
    };

    // Staggered text animation variants
    const titleVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const letterVariants = {
        hidden: { opacity: 0, y: 50 },
        show: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } 
        }
    };

    // Interactive mouse/touch position for the splash "light follow"
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
    const handleSplashInteraction = (e) => {
        const x = (e.clientX || (e.touches && e.touches[0].clientX) || 0);
        const y = (e.clientY || (e.touches && e.touches[0].clientY) || 0);
        setMousePos({ x, y });
    };

    if (isMobileWeb) {
        return <MobileLanding />;
    }

    return (
        <div 
            className="w-full h-full overflow-hidden select-none"
            data-theme={isDarkBg ? 'dark' : 'light'}
            onMouseMove={handleSplashInteraction}
            onTouchMove={handleSplashInteraction}
        >
            {/* High-Class Cinematic Splash Screen */}
            <AnimatePresence mode="wait">
                {!isReady && (
                    <motion.div 
                        key="cinematic-splash"
                        initial={{ opacity: 1 }}
                        exit={{ 
                            opacity: 0, 
                            scale: 1.1, 
                            filter: "blur(40px) brightness(1.5)",
                            backgroundColor: "rgba(0,0,0,0)"
                        }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[1000] bg-[#020202] flex flex-col items-center justify-center overflow-hidden"
                    >
                        {/* Interactive Dynamic Light Follow */}
                        <motion.div 
                            animate={{ 
                                x: mousePos.x - 200, 
                                y: mousePos.y - 200,
                                opacity: [0.15, 0.25, 0.15]
                            }}
                            transition={{ x: { type: "spring", damping: 30 }, y: { type: "spring", damping: 30 } }}
                            className="absolute w-[400px] h-[400px] bg-gradient-radial from-[#b88c5a]/30 to-transparent rounded-full blur-[80px] pointer-events-none mix-blend-screen overflow-hidden"
                        />

                        {/* Background Depth layer */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(184,140,90,0.05)_0%,transparent_70%)]" />

                        <div className="relative flex flex-col items-center z-10 w-full px-8">
                            
                            {/* The Cinematic Vinyl Label */}
                            <div className="relative mb-12">
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                                    className="relative w-40 h-40 sm:w-56 sm:h-56"
                                >
                                    {/* The etched vinyl base */}
                                    <div className="absolute inset-0 rounded-full bg-[#050505] shadow-[0_30px_100px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(255,255,255,0.02)] border border-white/5" />
                                    <div className="absolute inset-[15%] rounded-full bg-[repeating-radial-gradient(circle,transparent_0,transparent_2px,rgba(255,255,255,0.02)_3px,transparent_4px)]" />
                                    
                                    {/* The Logo Sticker */}
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-[30%] rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#b88c5a]/10 to-transparent" />
                                        <img src={pippofyLogo} alt="L" className="w-[60%] h-[60%] object-contain filter drop-shadow-[0_0_10px_rgba(184,140,90,0.4)]" />
                                    </motion.div>

                                    {/* Golden Edge Light */}
                                    <motion.div 
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 rounded-full border border-[#b88c5a]/20 blur-[1px]" 
                                    />
                                </motion.div>

                                {/* The Stylus dropping - Sychronized sequence */}
                                <motion.div
                                    initial={{ x: 100, y: -100, rotate: -30, opacity: 0 }}
                                    animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                                    transition={{ delay: 0.8, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute -top-10 -right-16 w-32 h-32 pointer-events-none"
                                >
                                    <div className="w-full h-2 bg-gradient-to-r from-transparent via-[#b88c5a]/40 to-transparent rounded-full blur-[4px] absolute -bottom-4 right-0" />
                                    <svg width="120" height="120" viewBox="0 0 100 100" className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                                        <path d="M80,20 L40,20 C35,20 30,25 30,30 L30,50 L25,55 L25,65 L35,65 L35,55 L30,50" fill="none" stroke="#b88c5a" strokeWidth="2.5" />
                                        <circle cx="28" cy="62" r="1.5" fill="#fff" className="animate-pulse" />
                                    </svg>
                                </motion.div>
                            </div>
                            
                            {/* Branding with Staggered Luxurious Reveal */}
                            <div className="flex flex-col items-center">
                                <motion.div 
                                    variants={titleVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="flex gap-1"
                                >
                                    {Array.from("Pippofy").map((letter, i) => (
                                        <motion.span
                                            key={i}
                                            variants={letterVariants}
                                            style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
                                            className="text-white text-5xl sm:text-7xl font-black tracking-widest drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                                        >
                                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#f3e1cc] to-[#b88c5a]">
                                                {letter}
                                            </span>
                                        </motion.span>
                                    ))}
                                </motion.div>
                                
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.8, duration: 1 }}
                                    className="mt-8 flex flex-col items-center"
                                >
                                    <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-[#b88c5a]/40 to-transparent mb-4" />
                                    <p className="text-[#b88c5a] text-[10px] sm:text-[12px] uppercase font-black tracking-[0.6em] text-center ml-2">
                                        Premium Vinyl Experience
                                    </p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Ground reflection glow */}
                        <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[30%] bg-gradient-radial from-[#b88c5a]/10 to-transparent blur-3xl pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`video-container transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
                {/* Light Background Video Layer */}
                <video 
                    className={`video-layer-light absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isDarkBg ? 'opacity-0' : 'opacity-100'}`}
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    disableRemotePlayback
                    disablePictureInPicture
                    preload="auto"
                    onCanPlay={handleVideoReady}
                >
                    <source src={bgVideo} type="video/mp4" />
                </video>

                {/* Dark Background Video Layer */}
                <video 
                    className={`video-layer-dark absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isDarkBg ? 'opacity-100' : 'opacity-0'}`} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    disableRemotePlayback
                    disablePictureInPicture
                    preload="auto"
                    onCanPlay={handleVideoReady}
                >
                    <source src={darkBgVideo} type="video/mp4" />
                </video>
            </div>
            
            <main className={`relative z-10 transition-all duration-1000 ${isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
                <Navbar isDarkBg={isDarkBg} setIsDarkBg={setIsDarkBg} />
            </main>
        </div>
    );
}
