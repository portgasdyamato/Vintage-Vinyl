import arm from "../assets/arm.png";

export default function Tonearm({ isPlaying }) {
    return (
        <div className="absolute top-1/2 right-25 transform -translate-y-1/2 flex items-center justify-center">
            
            <img
                src={arm}
                alt="Tonearm"
                className="transform transition-transform duration-150 rotate-y-10 trnaslate-z-100"
                style={{
                    width: '350px',
                    height: '600px',
                    rotate: isPlaying ? '75deg' : '35deg',
                }}
            />
            

        </div>
    );
}