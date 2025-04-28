import back from '../assets/back.png';

export default function Back({ handleBackClick }) {
    return (
        <div className="flex flex-col items-center justify-center">
            <div
                className="relative w-28 h-28 transform transition-transform duration-150 active:scale-75 m-0 p-0"
                onClick={handleBackClick} // Play the previous video on click
            >
                <img
                    src={back}
                    alt="Back Button"
                    className="w-full h-full rounded-full m-0 p-0"
                />
            </div>
        </div>
    );
}