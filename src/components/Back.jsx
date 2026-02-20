import back from '../assets/back.png';

export default function Back({ handleBackClick }) {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div
                className="w-full h-full transform transition-transform duration-150 active:scale-75"
            >
                <img
                    src={back}
                    alt="Back"
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    );
}