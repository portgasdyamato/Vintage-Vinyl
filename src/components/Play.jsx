import { useState, useEffect } from 'react';
import play from '../assets/play.png';
import stop from '../assets/stop.png';
import Disk from './Disk';
import Tonearm from './Tonearm';

export default function Play() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [spotifyLink, setSpotifyLink] = useState('');
    const [player, setPlayer] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('spotifyAccessToken'); // Ensure you have a valid token

        if (!token) {
            alert('Please log in to Spotify first.');
            return;
        }

        // Load the Spotify Web Playback SDK
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const spotifyPlayer = new window.Spotify.Player({
                name: 'Vinyl Player',
                getOAuthToken: (cb) => {
                    cb(token);
                },
                volume: 0.5,
            });

            setPlayer(spotifyPlayer);

            spotifyPlayer.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
            });

            spotifyPlayer.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            spotifyPlayer.connect();
        };
    }, []);

    const handleClick = async () => {
        if (!spotifyLink) {
            alert('Please enter a valid Spotify link.');
            return;
        }

        const token = localStorage.getItem('spotifyAccessToken'); // Ensure you have a valid token
        if (!token) {
            alert('Please log in to Spotify first.');
            return;
        }

        // Extract the Spotify URI from the link
        const uri = extractSpotifyUri(spotifyLink);
        if (!uri) {
            alert('Invalid Spotify link.');
            return;
        }

        // Play the song or playlist
        if (player) {
            const deviceId = await player._options.id;
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [uri] }),
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            setIsPlaying(true);
        }
    };

    const handleInputChange = (e) => {
        setSpotifyLink(e.target.value); // Update the Spotify link state
    };

    const extractSpotifyUri = (link) => {
        const match = link.match(/(?:https:\/\/open\.spotify\.com\/)(track|playlist)\/([a-zA-Z0-9]+)/);
        if (match) {
            return `spotify:${match[1]}:${match[2]}`;
        }
        return null;
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
            <div className="absolute bottom-30 left-15">
                <input
                    type="text"
                    placeholder=" Enter Spotify link"
                    value={spotifyLink}
                    onChange={handleInputChange}
                    className="spotify-input"
                />
            </div>
            <Disk isPlaying={isPlaying} />
            <Tonearm isPlaying={isPlaying} />
        </div>
    );
}