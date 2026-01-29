import React, { useState } from 'react';
import { IoChevronDown, IoAdd } from "react-icons/io5";

interface Option {
    text: string;
    isCorrect: boolean;
}

interface PollCreatorProps {
    question: string;
    setQuestion: (q: string) => void;
    options: Option[];
    setOptions: (opts: Option[]) => void;
    duration: number;
    setDuration: (d: number) => void;
    onAsk: () => void;
}

export const PollCreator: React.FC<PollCreatorProps> = ({
    question,
    setQuestion,
    options,
    setOptions,
    duration,
    setDuration,
    onAsk
}) => {
    // Duration dropdown kholne/band karne ke liye state
    const [showDurationMenu, setShowDurationMenu] = useState(false);

    // Option text ya correct status change karne ka handler
    const handleOptionChange = (idx: number, field: string, value: any) => {
        const newOptions = [...options];
        if (field === 'text') newOptions[idx].text = value;
        if (field === 'isCorrect') newOptions[idx].isCorrect = value;
        setOptions(newOptions);
    };

    // Naya blank option add karne ke liye
    const addOption = () => {
        setOptions([...options, { text: '', isCorrect: false }]);
    };

    return (
        <div className="pb-32"> {/* Content Wrapper with Padding */}
            {/* FORM SECTION */}
            <div className="space-y-8 bg-white rounded-xl">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-lg font-bold text-black">Enter your question</label>
                        {/* Duration Selector Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDurationMenu(!showDurationMenu)}
                                className="bg-gray-100 px-4 py-2 rounded-lg flex items-center text-black font-medium text-sm hover:bg-gray-200 transition-colors"
                            >
                                {duration} seconds <IoChevronDown className={`ml-2 text-primary transition-transform ${showDurationMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showDurationMenu && (
                                <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                                    {[10, 30, 60, 90, 120].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => { setDuration(t); setShowDurationMenu(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${duration === t ? 'text-primary font-bold bg-primary/5' : 'text-gray-700'}`}
                                        >
                                            {t} seconds
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Question Text Area */}
                    <div className="relative">
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="w-full bg-gray-100 border-none rounded-lg p-4 text-black text-lg outline-none resize-none h-32 focus:ring-1 focus:ring-primary"
                            placeholder="Type your question..."
                        />
                        <span className="absolute bottom-4 right-4 text-gray-400 text-xs">{question.length}/100</span>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-lg font-bold text-black">Edit Options</label>
                        <label className="text-lg font-bold text-black mr-12 hidden md:block">Is it Correct?</label>
                    </div>

                    {/* Options List */}
                    <div className="space-y-4">
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Option Text Input */}
                                <div className="flex items-center flex-1">
                                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold mr-4 text-sm shrink-0">
                                        {idx + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={opt.text}
                                        onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                                        className="w-full bg-gray-100 border-none rounded-lg p-3 text-black outline-none focus:ring-1 focus:ring-primary"
                                        placeholder={`Option ${idx + 1}`}
                                    />
                                </div>
                                {/* Correct/Incorrect Selection */}
                                <div className="flex items-center space-x-6 min-w-[150px]">
                                    <label className="flex items-center cursor-pointer">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${opt.isCorrect ? 'border-primary' : 'border-gray-300'}`}>
                                            {opt.isCorrect && <div className="w-3 h-3 bg-[#8F64E1] rounded-full"></div>}
                                        </div>
                                        <input type="radio" className="hidden" checked={opt.isCorrect} onChange={() => handleOptionChange(idx, 'isCorrect', true)} />
                                        <span className="font-medium text-black">Yes</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${!opt.isCorrect ? 'border-primary' : 'border-gray-300'}`}>
                                            {!opt.isCorrect && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                                        </div>
                                        <input type="radio" className="hidden" checked={!opt.isCorrect} onChange={() => handleOptionChange(idx, 'isCorrect', false)} />
                                        <span className="font-medium text-black">No</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Option Button */}
                    <button onClick={addOption} className="mt-6 border border-[#8F64E1] px-6 py-2 rounded-lg text-[#8F64E1] font-medium flex items-center text-sm hover:bg-primary/5 transition-colors">
                        <IoAdd className="mr-1 text-lg" /> Add More option
                    </button>
                </div>
            </div>

            {/* Fixed Footer with Ask Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:px-12 flex justify-end items-center gap-4 z-40">
                <button
                    onClick={onAsk}
                    className="bg-primary hover:bg-primary-dark text-white text-lg font-medium py-2 px-12 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                    Ask Question
                </button>
            </div>
        </div>
    );
};
