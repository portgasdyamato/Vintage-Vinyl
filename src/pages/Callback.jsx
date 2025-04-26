import { useEffect } from 'react';
import axios from 'axios';

export default function Callback() {
    useEffect(() => {
        const getAccessToken = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');

            if (code) {
                const response = await axios.post('https://accounts.spotify.com/api/token', null, {
                    params: {
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: 'https://vintage-vinyl.vercel.app/callback', // Replace with your Redirect URI
                        client_id: 'a48604bc1afb422e97991538924649bf', // Replace with your Spotify Client ID
                        client_secret: '56d0179618b4400bbc26cbdae3bf9fe2', // Replace with your Spotify Client Secret
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                const { access_token } = response.data;
                localStorage.setItem('spotifyAccessToken', access_token);
                window.location.href = '/'; // Redirect to the home page
            }
        };

        getAccessToken();
    }, []);

    return <div>Loading...</div>;
}