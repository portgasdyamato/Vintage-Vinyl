import React, { useState } from 'react';
import pippofy from '../assets/pippofy.png'; // Import the logo image
import menu from '../assets/menu.png'; // Import the menu image
import Queue from './Queue'; // Import the Queue component

export default function Navbar() {
    const [isQueueOpen, setIsQueueOpen] = useState(false); // State to toggle Queue visibility
    const [isQueueVisible, setIsQueueVisible] = useState(false); // State to control animation

    const toggleQueue = () => {
        if (isQueueOpen) {
            // If the queue is open, start the slide-out animation
            setIsQueueOpen(false);
            setTimeout(() => setIsQueueVisible(false), 500); // Wait for the animation to finish
        } else {
            // If the queue is closed, make it visible and start the slide-in animation
            setIsQueueVisible(true);
            setTimeout(() => setIsQueueOpen(true), 0);
        }
    };

    return (
        <>
            <nav className="fixed top-0 left-0 w-full h-15 z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    {/* Logo */}
                    <div className="font-bold flex items-center logo-hover">
                        <img
                            src={pippofy}
                            alt="Pippofy Logo"
                            className="h-14 w-25 mr-2"
                            style={{ marginLeft: '25px', marginTop: '5px' }}
                        />
                        <span className="text-pink-700 text-xl font-serif">Pippofy</span>
                    </div>

                    {/* Menu */}
                    <div className="flex space-x-6" style={{ marginRight: '40px' }}>
                        <img
                            src={menu}
                            alt="Menu"
                            className="h-14 w-18 menu-hover cursor-pointer"
                            onClick={toggleQueue} // Toggle Queue on click
                        />
                    </div>
                </div>
            </nav>

            {/* Queue Component */}
            {isQueueVisible && (
                <div className="fixed top-16 right-0 w-1/3 h-full z-20">
                    <Queue isVisible={isQueueOpen} />
                </div>
            )}
        </>
    );
}