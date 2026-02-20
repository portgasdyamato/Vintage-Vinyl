import next from '../assets/next.png';

export default function Next({ handleNextClick }) {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div
                className="w-full h-full transform transition-transform duration-150 active:scale-75"
            >
                <img
                    src={next}
                    alt="Next"
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    );
}