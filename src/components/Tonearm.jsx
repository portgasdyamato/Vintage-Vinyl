import arm from "../assets/arm.png";

export default function Tonearm({ isPlaying, parkAngle = '-10deg' }) {
    return (
        <div className="absolute top-0 right-0 h-full w-full flex items-start justify-end pointer-events-none z-20">
            <img
                src={arm}
                alt="Tonearm"
                className="transform transition-transform duration-700 ease-in-out"
                style={{
                    width: 'clamp(140px, 35vw, 350px)',
                    height: 'auto',
                    transform: `rotate(${isPlaying ? '25deg' : parkAngle})`,
                    transformOrigin: '50% 15%', // Precision pivot
                    marginTop: '5%',
                    marginRight: '5%',
                    filter: 'drop-shadow(0 25px 40px rgba(0,0,0,0.8))'
                }}
            />
        </div>
    );
}