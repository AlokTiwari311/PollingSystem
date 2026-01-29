import React from 'react';
import { IoTime, IoTrash } from "react-icons/io5";

interface QuestionQueueProps {
    queue: any[];
    launchPoll: (q: any) => void;
    deleteFromQueue: (index: number) => void;
}

export const QuestionQueue: React.FC<QuestionQueueProps> = ({ queue, launchPoll, deleteFromQueue }) => {
    if (queue.length === 0) return null;

    return (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center"><IoTime className="mr-2" /> Ready to Launch ({queue.length})</h3>
            <div className="space-y-3">
                {queue.map((q, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center border border-gray-100">
                        <div>
                            <p className="font-bold text-sm truncate max-w-md">{q.question}</p>
                            <p className="text-xs text-gray-400">{q.options.length} options • {q.duration}s</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => launchPoll(q)}
                                className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-md text-xs font-bold"
                            >
                                Launch
                            </button>
                            <button
                                onClick={() => deleteFromQueue(i)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded-md"
                            >
                                <IoTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
