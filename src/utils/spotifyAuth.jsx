export const getSpotifyAuthUrl = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID; // Access environment variable
    const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI; // Access environment variable
    const scopes = import.meta.env.VITE_SPOTIFY_SCOPES.split(' '); // Convert scopes string to an array

    return `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${encodeURIComponent(scopes.join(' '))}`;
};