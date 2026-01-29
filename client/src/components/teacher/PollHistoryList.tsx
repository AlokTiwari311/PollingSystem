import React from 'react';

interface PollHistoryListProps {
    pollHistory: any[];
}

export const PollHistoryList: React.FC<PollHistoryListProps> = ({ pollHistory }) => {
    return (
        <div className="bg-white max-w-4xl mx-auto rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-6">Poll History</h2>
            <div className="space-y-4">
                {pollHistory.map((p, i) => (
                    <div key={i} className="mb-12">
                        <h3 className="text-xl font-bold text-black mb-4">Question {i + 1}</h3>

                        {/* Question Header Card */}
                        <div className="bg-[#565656] text-white p-4 rounded-t-lg shadow-sm">
                            <h3 className="text-lg font-medium">{p.question}</h3>
                        </div>

                        {/* Options & Results */}
                        <div className="bg-white border border-gray-200 border-t-0 p-6 rounded-b-lg shadow-sm space-y-4">
                            {p.options.map((opt: string, idx: number) => {
                                const votes: number = p.votes ? Number(p.votes[idx.toString()] || p.votes[idx] || 0) : 0;
                                const total: number = p.votes ? Object.values(p.votes).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number : 0;
                                const percent = total > 0 ? Math.round((votes / total) * 100) : 0;

                                return (
                                    <div key={idx} className="relative w-full border border-gray-100 rounded-lg bg-white overflow-hidden p-1 shadow-sm">
                                        {/* Progress Bar Background */}
                                        <div
                                            className="absolute top-0 bottom-0 left-0 bg-[#5D5FEF] transition-all duration-1000 ease-out z-0 rounded-md"
                                            style={{ width: `${percent}%` }}
                                        />

                                        {/* Content Overlay */}
                                        <div className="relative z-10 flex items-center justify-between p-3">
                                            <div className="flex items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${percent > 0 ? 'bg-white text-[#5D5FEF]' : 'bg-gray-100 text-gray-500'}`}>
                                                    {idx + 1}
                                                </div>
                                                <span className={`font-medium ${percent > 50 ? 'text-white' : 'text-black'}`}>{opt}</span>
                                            </div>
                                            <span className={`font-bold ${percent > 50 ? 'text-white' : 'text-black'}`}>{percent}%</span>
                                        </div>
                                    </div>
                                );
                            })}

                        </div>
                    </div>
                ))}
                {pollHistory.length === 0 && <p className="text-gray-500">No history available.</p>}
            </div>
        </div>
    );
};
