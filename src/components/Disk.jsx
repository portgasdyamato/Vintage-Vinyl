import disk from '../assets/disk.png';
import fallbackImage from '../assets/dk.jpeg'; // Import the fallback image

export default function Disk({ isPlaying, videoUrl }) {
    // Extract YouTube video ID from the URL
    const getYouTubeThumbnail = (url) => {
        if (!url) return null; // Handle undefined or empty URL
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/) ||
                      url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/); // Support shortened URLs
        return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
    };

    const thumbnailUrl = getYouTubeThumbnail(videoUrl);

    return (
        <div className="relative flex flex-col items-center justify-center h-screen top-[-40px] left-20">
            <div
                className={`relative ${isPlaying ? 'rotating-disk' : ''}`}
                style={{
                    width: '700px',
                    height: '700px',
                }}
            >
                {/* Disk Image */}
                <img
                    src={disk}
                    alt="Disk"
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                    }}
                />

                {/* Video Thumbnail or Fallback Image */}
                <div
                    className="absolute"
                    style={{
                        width: '255px', // Adjust size of the thumbnail
                        height: '250px',
                        borderRadius: '50%',
                        backgroundImage: `url(${thumbnailUrl || fallbackImage})`, // Use thumbnail or fallback
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        top: '49%',
                        left: '49%',
                        transform: 'translate(-50%, -50%)', // Center the thumbnail
                    }}
                ></div>
            </div>
        </div>
    );
}