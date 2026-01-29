import React from 'react';

interface LivePollViewProps {
    activePoll: any;
    onStopPoll: () => void;
}

export const LivePollView: React.FC<LivePollViewProps> = ({ activePoll, onStopPoll }) => {
    return (
        <div className="max-w-4xl mx-auto mt-8 mb-24 relative min-h-[500px] ">
            {/* Top Right Actions */}
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-black">Question</h2>
            </div>

            <div className="bg-white rounded-xl shadow-lg bir overflow-hidden">
                <div className="bg-[#565656] text-white p-6">
                    <h3 className="text-xl font-medium">{activePoll.question}</h3>
                </div>

                <div className="p-6 space-y-4">
                    {activePoll.options.map((opt: string, idx: number) => {
                        const votes = activePoll.votes ? (activePoll.votes[idx.toString()] || activePoll.votes[idx] || 0) : 0;
                        const total = activePoll.votes ? Object.values(activePoll.votes).reduce((a: any, b: any) => a + b, 0) : 0;
                        const percent = (total as number) > 0 ? Math.round(((votes as number) / (total as number)) * 100) : 0;
                        return (
                            <div key={idx} className="relative w-full border border-gray-100 rounded-lg bg-white overflow-hidden p-1">
                                <div className="absolute top-0 bottom-0 left-0 bg-[#5D5FEF] transition-all duration-1000 ease-out z-0 rounded-md" style={{ width: `${percent}%` }} />
                                <div className="relative z-10 flex items-center justify-between p-4">
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${percent > 0 ? 'bg-white text-[#5D5FEF]' : 'bg-gray-100 text-gray-500'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className={`font-medium text-lg ${percent > 50 ? 'text-white' : 'text-black'}`}>{opt}</span>
                                    </div>
                                    <span className={`font-bold text-lg ${percent > 50 ? 'text-white' : 'text-black'}`}>{percent}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating "Ask a new question" Button */}
            <div className="flex justify-end mt-10 ">
                <button
                    onClick={onStopPoll}
                    className="bg-[#5D5FEF] text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:bg-[#4b4dcf] transition-transform hover:scale-105 flex items-center"
                >
                    + Ask a new question
                </button>
            </div>

        </div>
    );
};
