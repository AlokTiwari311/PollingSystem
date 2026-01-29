import React from 'react';
import { IoSparklesSharp } from "react-icons/io5";

export const WaitingScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="mb-12 animate-pulse">
                <span className="inline-flex items-center px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold shadow-md">
                    <IoSparklesSharp className="mr-2 text-yellow-300" /> Intervue Poll
                </span>
            </div>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
            <h2 className="text-xl font-bold text-black">Wait for the teacher to ask questions..</h2>
        </div>
    );
};
