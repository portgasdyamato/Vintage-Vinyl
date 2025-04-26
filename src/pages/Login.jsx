import { getSpotifyAuthUrl } from '../utils/spotifyAuth';

export default function Login() {
    const handleLogin = () => {
        window.location.href = getSpotifyAuthUrl();
    };

    return (
        <>
            <button onClick={handleLogin} className=" bg-green-600 text-white px-4 py-2 rounded">
                Login with Spotify
            </button>
        </>
    );
}