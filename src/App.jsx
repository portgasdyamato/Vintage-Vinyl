import Play from './components/Play';
import Navbar from './components/Navbar';
import './App.css'; // Import the CSS file for styling
import bgVideo from './assets/bg.mp4'; // Import the background video

export default function App() {
    return (
        <>
                        <div className="video-container">
                <video className="background-video" autoPlay muted loop>
                    <source src={bgVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
            <Navbar />
            <Play />
        </>
    );
}
