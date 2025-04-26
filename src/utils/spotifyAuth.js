export const getSpotifyAuthUrl = () => {
    const clientId = 'a48604bc1afb422e97991538924649bf'; // Replace with your Spotify Client ID
    const redirectUri = 'https://vintage-vinyl.vercel.app/callback'; // Replace with your Redirect URI
    const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-modify-playback-state',
    ];

    return `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${encodeURIComponent(scopes.join(' '))}`;
};