import next from '../assets/next.png';

export default function Next({ handleNextClick }) {
    return (
        <div className="flex flex-col items-center justify-center">
            <div
                className="relative w-28 h-28 transform transition-transform duration-150 active:scale-75 m-0 p-0"
                onClick={handleNextClick} // Play the next video on click
            >
                <img
                    src={next}
                    alt="Next Button"
                    className="w-full h-full rounded-full m-0 p-0"
                />
            </div>
        </div>
    );
}