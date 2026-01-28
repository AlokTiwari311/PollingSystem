import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { usePollTimer } from '../hooks/usePollTimer';
import { IoSparklesSharp, IoChatbubbleEllipsesSharp, IoSend, IoClose, IoTime, IoPeople } from "react-icons/io5";

const Student = () => {
    const socket = useSocket();
    const [name, setName] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [isKicked, setIsKicked] = useState(false);
    const [activePoll, setActivePoll] = useState<any>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Chat & Participants State
    const [showChat, setShowChat] = useState(false);
    const [chatTab, setChatTab] = useState<'chat' | 'participants'>('chat');
    const [participants, setParticipants] = useState<string[]>([]);
    const [chatMessages, setChatMessages] = useState<{ sender: string, text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedName = sessionStorage.getItem('studentName');
        if (savedName) {
            setName(savedName);
            setIsJoined(true);
        }
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('poll_update', (poll) => { setActivePoll(poll); setHasVoted(false); setSelectedOption(null); });
        socket.on('poll_created', (poll) => { setActivePoll(poll); setHasVoted(false); setSelectedOption(null); });
        socket.on('poll_results_update', (results) => setActivePoll((prev: any) => prev ? { ...prev, votes: results } : prev));

        socket.on('participants_update', (list: string[]) => {
            setParticipants(list);
        });

        // Chat & Kick
        socket.on('chat_message', (msg) => {
            setChatMessages(prev => [...prev, msg]);
            // Auto-scroll
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        socket.on('kick_student', (kickedName) => {
            if (kickedName === name || kickedName === sessionStorage.getItem('studentName')) {
                setIsKicked(true);
                sessionStorage.removeItem('studentName');
                // Don't reset name/isJoined yet so we show the kicked screen instead of login
            }
        });

        // Re-join logic for resilience
        const savedName = sessionStorage.getItem('studentName');
        if (savedName) {
            socket.emit('join_session', savedName);
        }

        return () => {
            socket.off('poll_update');
            socket.off('poll_created');
            socket.off('poll_results_update');
            socket.off('chat_message');
            socket.off('kick_student');
            socket.off('participants_update');
        };
    }, [socket, name]);

    const timeLeft = usePollTimer(activePoll?.startTime, activePoll?.timerDuration || 0);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            // Uniqueness check could be here or backend, strictly per session requirement is satisfied by sessionStorage
            sessionStorage.setItem('studentName', name);
            if (socket) socket.emit('join_session', name);
            setIsJoined(true);
        }
    };

    const handleVote = () => {
        if (!socket || !activePoll || selectedOption === null) return;
        socket.emit('vote', { pollId: activePoll.id, studentName: name, optionIndex: selectedOption });
        setHasVoted(true);
    };

    const sendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() && socket) {
            socket.emit('chat_message', { sender: name, text: chatInput });
            setChatInput('');
        }
    }

    if (isKicked) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans text-center">
                <div className="mb-6">
                    <span className="inline-flex items-center px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold shadow-md">
                        <IoSparklesSharp className="mr-2 text-yellow-300" /> Intervue Poll
                    </span>
                </div>
                <h1 className="text-4xl font-normal text-black mb-4">You've been Kicked out !</h1>
                <p className="text-gray-500 max-w-md text-lg">
                    Looks like the teacher had removed you from the poll system .Please Try again sometime.
                </p>
            </div>
        );
    }

    if (!isJoined) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
                <div className="mb-8">
                    <span className="inline-flex items-center px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold shadow-md">
                        <IoSparklesSharp className="mr-2 text-yellow-300" /> Intervue Poll
                    </span>
                </div>

                <h1 className="text-4xl font-bold text-black mb-12">Let's Get Started</h1>

                <form onSubmit={handleJoin} className="w-full max-w-lg space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-black ml-1">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-100 border border-transparent focus:bg-white focus:border-primary rounded-lg p-4 text-black outline-none transition-all font-medium"
                            placeholder="e.g. Rahul Bajaj"
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-12 rounded-full shadow-lg transition-transform hover:scale-105"
                        >
                            Continue
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    const showResults = hasVoted || (activePoll && timeLeft === 0);

    return (
        <div className="min-h-screen bg-white font-sans relative">
            {/* Main Content Area */}
            {!activePoll ? (
                // WAITING STATE
                <div className="flex flex-col items-center justify-center min-h-screen p-6">
                    <div className="mb-12 animate-pulse">
                        <span className="inline-flex items-center px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold shadow-md">
                            <IoSparklesSharp className="mr-2 text-yellow-300" /> Intervue Poll
                        </span>
                    </div>
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
                    <h2 className="text-xl font-bold text-black">Wait for the teacher to ask questions..</h2>
                </div>
            ) : (
                // ACTIVE POLL STATE
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
                                        const percent = total > 0 ? Math.round(((votes as number) / (total as number)) * 100) : 0;
                                        return (
                                            <div key={idx} className="relative w-full border border-gray-100 rounded-lg bg-white overflow-hidden p-1">
                                                <div className="absolute top-0 bottom-0 left-0 bg-primary/80 transition-all duration-1000 ease-out z-0" style={{ width: `${percent}%` }} />
                                                <div className="relative z-10 flex items-center justify-between p-3">
                                                    <div className="flex items-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 bg-white text-primary shadow-sm`}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className={`font-medium ${percent > 50 ? 'text-white' : 'text-black'}`}>{opt}</span>
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
            )}

            {/* Chat Floating Button */}
            {activePoll && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                    >
                        {showChat ? <IoClose size={24} /> : <IoChatbubbleEllipsesSharp size={24} />}
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {activePoll && showChat && (
                <div className="fixed bottom-24 right-8 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-fade-in-up h-96">
                    <div className="bg-primary text-white font-bold flex">
                        <button
                            onClick={() => setChatTab('chat')}
                            className={`flex-1 p-3 text-center ${chatTab === 'chat' ? 'bg-primary-dark' : 'hover:bg-white/10'}`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setChatTab('participants')}
                            className={`flex-1 p-3 text-center ${chatTab === 'participants' ? 'bg-primary-dark' : 'hover:bg-white/10'}`}
                        >
                            Participants ({participants.length})
                        </button>
                    </div>

                    {chatTab === 'chat' && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                {chatMessages.map((msg, i) => {
                                    const isSelf = msg.sender === name;
                                    return (
                                        <div key={i} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                                            <span className={`text-xs font-bold mb-1 text-primary`}>
                                                {msg.sender}
                                            </span>
                                            <div className={`max-w-[85%] px-4 py-3 rounded-xl text-sm shadow-sm ${isSelf
                                                ? 'bg-primary text-white rounded-br-none'
                                                : 'bg-[#333333] text-white rounded-bl-none'
                                                }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={sendChat} className="p-3 border-t border-gray-100 bg-white flex items-center">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary text-black"
                                    placeholder="Type a message..."
                                />
                                <button type="submit" className="ml-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark">
                                    <IoSend size={14} />
                                </button>
                            </form>
                        </>
                    )}

                    {chatTab === 'participants' && (
                        <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
                            {participants.length === 0 && <p className="text-center text-gray-400 mt-4">No participants.</p>}
                            {participants.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm mb-2 border border-gray-100">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                                            <IoPeople />
                                        </div>
                                        <span className="font-medium text-sm text-black">{p}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Student;
