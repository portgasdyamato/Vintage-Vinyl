import { useState } from 'react';
import play from '../assets/play.png';
import stop from '../assets/stop.png';
import Disk from './Disk';
import Tonearm from './Tonearm';

export default function Play() {
    const [isPlaying, setIsPlaying] = useState(false);

    const handleClick = () => {
        setIsPlaying(!isPlaying); // Toggle between play and stop
    };

    return (
        <div className="relative flex flex-col items-center justify-center h-screen">
            <div className="absolute top-20 left-15">
                <img
                    src={isPlaying ? stop : play} // Toggle image based on state
                    alt={isPlaying ? 'Stop Button' : 'Play Button'}
                    className="w-28 h-28 transform transition-transform duration-150 active:scale-75"
                    onClick={handleClick}
                />
            </div>
            <Disk isPlaying={isPlaying} />
            <Tonearm isPlaying={isPlaying}/>
        </div>
    );
}