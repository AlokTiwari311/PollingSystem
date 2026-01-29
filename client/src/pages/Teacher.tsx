import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { usePollTimer } from '../hooks/usePollTimer';
import axios from 'axios';
import { IoSparklesSharp, IoBriefcase } from "react-icons/io5";
import { PollCreator } from '../components/teacher/PollCreator';
import { LivePollView } from '../components/teacher/LivePollView';
import { PollHistoryList } from '../components/teacher/PollHistoryList';
import { TeacherChatPanel } from '../components/teacher/TeacherChatPanel';

const Teacher = () => {
    const socket = useSocket();

    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
    ]);
    const [duration, setDuration] = useState(60);

    const [activePoll, setActivePoll] = useState<any>(null);
    const [pollHistory, setPollHistory] = useState<any[]>([]);

    const [viewMode, setViewMode] = useState<'create' | 'history' | 'live'>('create');

    const [chatMessages, setChatMessages] = useState<{ sender: string, text: string }[]>([]);
    const [participants, setParticipants] = useState<string[]>([]);

    const timeLeft = usePollTimer(activePoll?.startTime, activePoll?.duration || 0);

    const connectedStudents = participants.filter(p => p !== 'Teacher (Host)').length;

    const localPollStartRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!socket) return;

        socket.on('poll_update', (p) => {
            setActivePoll(p);
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
            localPollStartRef.current = Date.now();
            setViewMode('live');
        });

        socket.on('poll_results_update', (results) => {
            setActivePoll((prev: any) => prev ? { ...prev, votes: results } : prev);
        });

        socket.on('chat_message', (msg) => {
            setChatMessages(prev => [...prev, msg]);
        });

        socket.on('participants_update', (list: string[]) => {
            setParticipants(list);
        });

        socket.emit('join_session', 'Teacher (Host)');

        return () => {
            socket.off('poll_update');
            socket.off('poll_created');
            socket.off('poll_results_update');
            socket.off('chat_message');
            socket.off('participants_update');
        };
    }, [socket]);


    const fetchHistory = async () => {
        try {
            const res = await axios.get('https://pollingsystem-1-f5te.onrender.com/history');
            setPollHistory(res.data);
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    };

    useEffect(() => {
        if (viewMode === 'history') {
            fetchHistory();
        }
    }, [viewMode]);

    const launchPoll = (qData: any) => {
        if (!socket) return;

        socket.emit('create_poll', {
            question: qData.question,
            options: qData.options || qData.options.map((o: any) => o.text),
            duration: qData.duration
        });

        setActivePoll(null);
    };

    const handleAskQuestion = () => {
        const optionTexts = options.map(o => o.text).filter(t => t.trim() !== '');

        if (!question.trim() || optionTexts.length < 2) return;

        launchPoll({ id: Date.now(), question, options: optionTexts, duration });

        setQuestion('');
        setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
    };

    const handleStopPoll = () => {
        socket?.emit('stop_poll');
        setActivePoll(null);
        setViewMode('create');
    }

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
                <div className="flex-1">

                    {viewMode === 'history' && (
                        <PollHistoryList pollHistory={pollHistory} />
                    )}

                    {viewMode === 'create' && (
                        <div>
                            <div className="max-w-4xl">
                                <h1 className="text-4xl font-bold text-black mb-4">Let's Get Started</h1>
                                <p className="text-gray-500 mb-8 max-w-2xl">
                                    Create polls and manage realtime sessions.
                                </p>

                                <PollCreator
                                    question={question}
                                    setQuestion={setQuestion}
                                    options={options}
                                    setOptions={setOptions}
                                    duration={duration}
                                    setDuration={setDuration}
                                    onAsk={handleAskQuestion}
                                />
                            </div>
                        </div>
                    )}

                    {viewMode === 'live' && activePoll && (
                        <LivePollView
                            activePoll={activePoll}
                            onStopPoll={handleStopPoll}
                        />
                    )}
                </div>

                {activePoll && activePoll.isActive && (
                    <TeacherChatPanel
                        socket={socket}
                        participants={participants}
                        chatMessages={chatMessages}
                    />
                )}

            </div>
        </>
    );
};

export default Teacher;
