import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { usePollTimer } from '../hooks/usePollTimer';
import axios from 'axios';
import { IoSparklesSharp, IoChatbubbleEllipsesSharp, IoAdd, IoChevronDown, IoSend, IoClose, IoTime, IoPeople, IoStatsChart, IoTrash, IoBriefcase } from "react-icons/io5";

const Teacher = () => {
    const socket = useSocket();
    // Poll Creation State
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
    ]);
    const [duration, setDuration] = useState(60);

    // Management State
    const [activePoll, setActivePoll] = useState<any>(null);
    const [questionQueue, setQuestionQueue] = useState<any[]>([]);
    const [pollHistory, setPollHistory] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'create' | 'history' | 'live'>('create');

    // Chat & Participants State
    const [showChatPanel, setShowChatPanel] = useState(false);
    const [showDurationMenu, setShowDurationMenu] = useState(false);
    const [chatTab, setChatTab] = useState<'chat' | 'participants'>('chat');
    const [chatMessages, setChatMessages] = useState<{ sender: string, text: string }[]>([]);
    const [participants, setParticipants] = useState<string[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Timer & Logic Hooks
    const timeLeft = usePollTimer(activePoll?.startTime, activePoll?.duration || 0);

    // Derived State
    const connectedStudents = participants.filter(p => p !== 'Teacher (Host)').length;
    const totalVotes = activePoll?.votes ? Object.values(activePoll.votes).reduce((a: any, b: any) => a + b, 0) : 0;
    const allAnswered = connectedStudents > 0 && (totalVotes as number) >= connectedStudents;

    // Local timer to prevent clock-skew issues causing rapid skipping
    const localPollStartRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!socket) return;
        socket.on('poll_update', (p) => {
            setActivePoll(p);
            // Verify if it's a new poll to reset local timer
            if (p) {
                if (p.id !== activePoll?.id) {
                    localPollStartRef.current = Date.now();
                }
                if (p.isActive) {
                    setViewMode('live');
                }
            }
        });
        socket.on('poll_created', (poll) => {
            setActivePoll(poll);
            localPollStartRef.current = Date.now(); // Reset local timer on new poll
            setViewMode('live');
        });
        socket.on('queue_update', (q) => {
            setQuestionQueue(q);
        });

        // Initial Queue Fetch
        socket.emit('get_queue');
        socket.on('poll_results_update', (results) => {
            setActivePoll((prev: any) => prev ? { ...prev, votes: results } : prev);
        });

        socket.on('chat_message', (msg) => {
            setChatMessages(prev => [...prev, msg]);
            if (showChatPanel && chatTab === 'chat') {
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        });

        socket.on('participants_update', (list: string[]) => {
            setParticipants(list);
        });

        // Initial join as Teacher
        socket.emit('join_session', 'Teacher (Host)');

        return () => {
            socket.off('poll_update');
            socket.off('poll_created');
            socket.off('poll_results_update');
            socket.off('chat_message');
            socket.off('participants_update');
        };
    }, [socket, showChatPanel, chatTab]);

    // Auto-Advance Logic
    useEffect(() => {
        // Guard: Don't auto-advance if poll has been visible LOCALLY for less than 5 seconds
        // This fixes the "Clock Skew" issue where server time is in the past relative to client
        const localTimeActive = Date.now() - localPollStartRef.current;
        if (localTimeActive < 5000) return;

        // Trigger if: (Time is up OR All students answered) AND Queue has items
        if (activePoll && (timeLeft === 0 || allAnswered) && questionQueue.length > 0) {
            console.log("Auto-advancing queue.", { timeLeft, allAnswered, localTimeActive });
            const nextQ = questionQueue[0];
            launchPoll(nextQ);
        }
    }, [timeLeft, allAnswered, activePoll, questionQueue]);





    const fetchHistory = async () => {
        try {
            const res = await axios.get('http://localhost:3000/history');
            setPollHistory(res.data);
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    };

    // Toggle View Mode
    useEffect(() => {
        if (viewMode === 'history') {
            fetchHistory();
        }
    }, [viewMode]);

    const handleOptionChange = (idx: number, field: string, value: any) => {
        const newOptions = [...options];
        if (field === 'text') newOptions[idx].text = value;
        if (field === 'isCorrect') newOptions[idx].isCorrect = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { text: '', isCorrect: false }]);
    };

    const addToQueue = () => {
        const optionTexts = options.map(o => o.text).filter(t => t.trim() !== '');
        if (!question.trim() || optionTexts.length < 2) return false;

        // Emit to server instead of local state
        socket?.emit('add_to_queue', { question, options: optionTexts, duration });

        // Reset Form
        setQuestion('');
        setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
        return true;
    };

    const launchPoll = (qData: any) => {
        if (!socket) return;

        // If it has an _id (from DB/Queue), use launch_queued_poll
        if (qData._id) {
            socket.emit('launch_queued_poll', qData._id);
        } else {
            // New poll creation
            socket.emit('create_poll', {
                question: qData.question,
                options: qData.options || qData.options.map((o: any) => o.text),
                duration: qData.duration
            });
        }

        // Optimistically clear active poll to prevent auto-advance from triggering again immediately
        setActivePoll(null);

        // Do NOT force view change, allow user to stay in Create/Live as they wish.
    };

    const handleAskQuestion = () => {
        const optionTexts = options.map(o => o.text).filter(t => t.trim() !== '');
        if (!question.trim() || optionTexts.length < 2) return;

        // SMART LOGIC:
        // If Poll Active (and not finished) -> Queue it
        // Else -> Launch it

        if (activePoll && activePoll.isActive) {
            if (addToQueue()) {
                alert("Poll in progress. Question added to Queue!");
            }
        } else {
            launchPoll({ id: Date.now(), question, options: optionTexts, duration });
            setQuestion('');
            setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
        }
    };

    const launchDirectly = handleAskQuestion;

    const sendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() && socket) {
            socket.emit('chat_message', { sender: 'Teacher', text: chatInput });
            setChatInput('');
        }
    }

    const kickStudent = (studentName: string) => {
        socket?.emit('kick_student', studentName);
    }

    const hasPoll = activePoll?.isActive;

    return (
        <>
            <div className="bg-white font-sans p-6 md:p-12 relative ">
                <div className="flex justify-between items-center mb-6">
                    <span className="inline-flex items-center px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold shadow-md">
                        <IoSparklesSharp className="mr-2 text-yellow-300" /> Intervue Poll
                    </span>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                if (viewMode === 'history') {
                                    if (activePoll && activePoll.isActive) {
                                        setViewMode('live');
                                    } else {
                                        setViewMode('create');
                                    }
                                } else {
                                    setViewMode('history');
                                }
                            }}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center shadow-sm ${viewMode === 'history' ? 'bg-[#8F64E1] text-white' : 'bg-[#8F64E1] text-black hover:bg-gray-200'}`}
                        >
                            <IoBriefcase className="mr-2" /> {viewMode === 'history' ? 'Back' : 'View Poll history'}
                        </button>
                    </div>
                </div>
                {/* Left Main Content */}
                <div className="flex-1 ">
                    {/* Header Badge */}


                    {viewMode === 'history' && (
                        // HISTORY VIEW
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-2xl font-bold mb-6">Poll History</h2>
                            <div className="space-y-4">
                                {pollHistory.map((p, i) => (
                                    <div key={i} className="mb-12">
                                        <h3 className="text-xl font-bold text-black mb-4">Question {i + 1}</h3>

                                        {/* Question Header Card */}
                                        <div className="bg-[#565656] text-white p-6 rounded-t-lg shadow-sm">
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
                                            <div className="mt-2 text-right text-xs text-gray-400">
                                                {new Date(p.startTime).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {pollHistory.length === 0 && <p className="text-gray-500">No history available.</p>}
                            </div>
                        </div>
                    )}

                    {viewMode === 'create' && (
                        // CREATE / QUEUE VIEW
                        <div>
                            <div className="max-w-4xl">
                                <h1 className="text-4xl font-bold text-black mb-4">Let's Get Started</h1>
                                <p className="text-gray-500 mb-8 max-w-2xl">
                                    Create polls, queue multiple questions, and manage realtime sessions.
                                </p>

                                {/* QUEUE SECTION */}
                                {questionQueue.length > 0 && (
                                    <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <h3 className="font-bold text-gray-700 mb-3 flex items-center"><IoTime className="mr-2" /> Ready to Launch ({questionQueue.length})</h3>
                                        <div className="space-y-3">
                                            {questionQueue.map((q, i) => (
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
                                                            onClick={() => setQuestionQueue(questionQueue.filter((_, idx) => idx !== i))}
                                                            className="text-red-500 hover:bg-red-50 p-1 rounded-md"
                                                        >
                                                            <IoTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pb-32"> {/* Content Wrapper with Padding */}
                                    {/* FORM SECTION */}
                                    <div className="space-y-8 bg-white rounded-xl">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-lg font-bold text-black">Enter your question</label>
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

                                            <div className="space-y-4">
                                                {options.map((opt, idx) => (
                                                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                                            <button onClick={addOption} className="mt-6 border border-[#8F64E1] px-6 py-2 rounded-lg text-[#8F64E1] font-medium flex items-center text-sm hover:bg-primary/5 transition-colors">
                                                <IoAdd className="mr-1 text-lg" /> Add More option
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Fixed Footer */}
                                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:px-12 flex justify-end items-center gap-4 z-40">
                                    <button
                                        onClick={handleAskQuestion}
                                        className="bg-primary hover:bg-primary-dark text-white text-lg font-medium py-2 px-12 rounded-full shadow-lg transition-transform hover:scale-105"
                                    >
                                        {(activePoll && activePoll.isActive) ? 'Queue Question' : 'Ask Question'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'live' && activePoll && (
                        // LIVE POLL VIEW
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
                                        const percent = total > 0 ? Math.round(((votes as number) / (total as number)) * 100) : 0;
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
                                    onClick={() => {
                                        socket?.emit('stop_poll');
                                        setActivePoll(null);
                                        setViewMode('create');
                                    }}
                                    className="bg-[#5D5FEF] text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:bg-[#4b4dcf] transition-transform hover:scale-105 flex items-center"
                                >
                                    + Ask a new question
                                </button>
                            </div>

                        </div>
                    )}
                </div>


                {/* Floating Chat/Participants Panel */}
                {/* Floating Chat/Participants Panel */}
                {activePoll && activePoll.isActive && (
                    <div className={`fixed bottom-40 right-8 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden transition-all duration-300 ${showChatPanel ? 'h-96 opacity-100' : 'h-0 opacity-0 pointer-events-none'}`}>
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
                                        const isSelf = msg.sender === 'Teacher';
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
                                {participants.length === 0 && <p className="text-center text-gray-400 mt-4">No students connected.</p>}
                                {participants.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm mb-2 border border-gray-100">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                                                <IoPeople />
                                            </div>
                                            <span className="font-medium text-sm">{p}</span>
                                        </div>
                                        {p !== 'Teacher (Host)' && (
                                            <button
                                                onClick={() => kickStudent(p)}
                                                className="text-red-500 hover:bg-red-50 p-1 rounded text-xs font-bold border border-red-200"
                                            >
                                                Kick
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Toggle Chat Button - Always visible if active, changes icon */}
            {
                (
                    <div className="fixed bottom-24 right-6 z-50 transition-all duration-300">
                        <button
                            onClick={() => setShowChatPanel(!showChatPanel)}
                            className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                        >
                            {showChatPanel ? <IoClose size={24} /> : <IoChatbubbleEllipsesSharp size={24} />}
                        </button>
                    </div>
                )
            }
        </>
    );
};

export default Teacher;
