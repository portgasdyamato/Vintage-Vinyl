import { useEffect, useState } from 'react';

export default function SpotifyPlayer() {
    const [player, setPlayer] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('spotifyAccessToken');

        if (!token) {
            window.location.href = '/login'; // Redirect to login if no token
            return;
        }

        // Load the Spotify Web Playback SDK script
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        // Initialize the Spotify player when the SDK is ready
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

    const handlePlay = async () => {
        if (player) {
            const deviceId = await player._options.id;
            const trackUri = 'spotify:track:5meVa5klVlJalupZTvv5XX';
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [trackUri] }),
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('spotifyAccessToken')}`,
                    'Content-Type': 'application/json',
                },
            });
        }
    };

    return (
        <button onClick={handlePlay} className="play-button">
            Play
        </button>
    );
}