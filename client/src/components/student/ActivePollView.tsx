import React from 'react';
import { IoTime } from "react-icons/io5";

interface ActivePollViewProps {
    activePoll: any;
    timeLeft: number;
    selectedOption: number | null;
    setSelectedOption: (index: number) => void;
    handleVote: () => void;
    hasVoted: boolean;
}

export const ActivePollView: React.FC<ActivePollViewProps> = ({
    activePoll,
    timeLeft,
    selectedOption,
    setSelectedOption,
    handleVote,
    hasVoted
}) => {
    const showResults = hasVoted || (activePoll && timeLeft === 0);

    return (
        <div className="p-6 md:p-12 flex justify-center min-h-screen">
            <div className="w-full max-w-3xl">
                <div className="flex items-center mb-6 w-full space-x-8">
                    <h2 className="text-2xl font-bold text-black">Question 1</h2>
                    {timeLeft >= 0 && (
                        <span className="text-red-500 font-bold text-lg flex items-center">
                            <IoTime className="mr-2 text-2xl" />
                            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                        </span>
                    )}
                </div>

                <div className="bg-[#565656] text-white p-6 rounded-t-lg shadow-sm">
                    <h3 className="text-lg font-medium">{activePoll.question}</h3>
                </div>

                <div className="bg-white border border-gray-200 border-t-0 p-6 rounded-b-lg shadow-sm space-y-4">
                    {!showResults ? (
                        <>
                            {activePoll.options.map((opt: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedOption(idx)}
                                    className={`w-full text-left p-4 rounded-lg flex items-center border transition-all ${selectedOption === idx
                                        ? 'border-primary bg-white ring-1 ring-primary'
                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${selectedOption === idx ? 'bg-primary text-white' : 'bg-gray-400 text-white'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <span className="text-black font-medium">{opt}</span>
                                </button>
                            ))}
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleVote}
                                    disabled={selectedOption === null}
                                    className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-12 rounded-full shadow-lg transition-all"
                                >
                                    Submit
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {activePoll.options.map((opt: string, idx: number) => {
                                const votes = activePoll.votes ? (activePoll.votes[idx.toString()] || activePoll.votes[idx] || 0) : 0;
                                const total = activePoll.votes ? Object.values(activePoll.votes).reduce((a: any, b: any) => a + b, 0) : 0;
                                const percent = ((total as number) > 0) ? Math.round(((votes as number) / (total as number)) * 100) : 0;
                                const isSelected = selectedOption === idx;

                                return (
                                    <div key={idx} className={`relative w-full border rounded-lg bg-white overflow-hidden p-1 ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-100'}`}>
                                        <div className="absolute top-0 bottom-0 left-0 bg-primary/80 transition-all duration-1000 ease-out z-0" style={{ width: `${percent}%` }} />
                                        <div className="relative z-10 flex items-center justify-between p-3">
                                            <div className="flex items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 shadow-sm ${isSelected ? 'bg-primary text-white border-2 border-white' : 'bg-white text-primary'}`}>
                                                    {idx + 1}
                                                </div>
                                                <span className={`font-medium ${percent > 50 ? 'text-white' : 'text-black'}`}>
                                                    {opt} {isSelected && "(You voted)"}
                                                </span>
                                            </div>
                                            <span className={`font-bold ${percent > 50 ? 'text-white' : 'text-black'}`}>{percent}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
                <div className="text-center mt-12">
                    <h3 className="text-lg font-bold text-black">Wait for the teacher to ask a new question..</h3>
                </div>
            </div>
        </div>
    );
};
