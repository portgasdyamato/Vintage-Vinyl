import React from 'react';
import board from '../assets/board.png';

export default function Queue({ isVisible }) {
    return (
        <div className={`p-1   ${isVisible ? 'animate-slide-in' : 'animate-slide-out'}`}>
            <img
                src={board}
                alt="Queue Image"
                className="absolute"
                style={{ right: '-130px', position: 'relative' }} // Move image further to the right
            />
            <h2 className="text-xl font-bold mb-4">Queue</h2>
            <ul>
                <li className="mb-2">Song 1</li>
                <li className="mb-2">Song 2</li>
                <li className="mb-2">Song 3</li>
            </ul>
        </div>
    );
}
