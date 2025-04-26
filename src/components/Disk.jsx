import disk from '../assets/disk.png';

export default function Disk({ isPlaying }) {
    return (
        <div className="relative flex flex-col items-center justify-center h-screen">
            <div className="relative">
                <img
                    className={`${
                        isPlaying ? 'rotating-disk' : ''
                    }`}
                    style={{
                        width: '700px',
                        height: '700px',
                    }}
                    src={disk}
                    alt="Disk"
                />
                <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold bg-amber-400 rounded-full w-68 h-68 top-54 left-54 rotating-disk ">
                    hehe
                </div>
            </div>
        </div>
    );
}