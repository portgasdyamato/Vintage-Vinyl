import { getSpotifyAuthUrl } from '../utils/spotifyAuth';

export default function Login() {
    const handleLogin = () => {
        window.location.href = getSpotifyAuthUrl(); // Redirect to Spotify login
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <button
                onClick={handleLogin}
                className="bg-green-500 text-white px-4 py-2 rounded"
            >
                Login with Spotify
            </button>
        </div>
    );
}