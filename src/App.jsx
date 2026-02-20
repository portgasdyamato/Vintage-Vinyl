import React, { useEffect } from 'react';
import Play from './components/Play';
import Navbar from './components/Navbar';
import './App.css'; // Import the CSS file for styling
import bgVideo from './assets/bg.mp4'; // Import the background video
import pippofyLogo from './assets/pippofy.png'; // Import the branding logo
import { LocalNotifications } from '@capacitor/local-notifications';

export default function App() {
    const [isReady, setIsReady] = React.useState(false);

    useEffect(() => {
        // Request permissions for notifications on mount
        const requestPermissions = async () => {
            const status = await LocalNotifications.checkPermissions();
            if (status.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }
        };
        requestPermissions();
    }, []);

    // Handle video ready state
    const handleVideoReady = () => {
        setTimeout(() => setIsReady(true), 3500); // 3.5s delay for a premium feel
    };

    return (
        <>
            {/* High-Class Splash Screen Overlay */}
            {!isReady && (
                <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center animate-fade-in">
                    <div className="relative flex flex-col items-center">
                        <div className="w-24 h-24 mb-6 relative animate-pulse-slow p-2">
                            <img src={pippofyLogo} alt="Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(184,140,90,0.5)]" />
                            <div className="absolute inset-0 border-2 border-[#b88c5a]/30 rounded-full animate-ping shadow-[0_0_15px_#b88c5a]"></div>
                        </div>
                        <h1 className="text-[#b88c5a] text-4xl font-serif tracking-[0.3em] uppercase font-bold animate-shimmer">Pippofy</h1>
                        <p className="text-white/20 text-[10px] mt-4 uppercase tracking-[0.5em] font-bold">Premium Vinyl Experience</p>
                    </div>
                </div>
            )}

            <div className={`video-container transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
                <video 
                    className="background-video" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    onCanPlay={handleVideoReady}
                >
                    <source src={bgVideo} type="video/mp4" />
                </video>
            </div>
            
            <div className={`transition-all duration-1000 ${isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
                <Navbar />
            </div>
        </>
    );
}
