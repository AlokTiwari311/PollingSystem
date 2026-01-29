import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { usePollTimer } from '../hooks/usePollTimer';
import { IoSparklesSharp } from "react-icons/io5";
import { WaitingScreen } from '../components/student/WaitingScreen';
import { ActivePollView } from '../components/student/ActivePollView';
import { StudentChatPanel } from '../components/student/StudentChatPanel';

const Student = () => {
    const socket = useSocket();
    // Basic User Info
    const [name, setName] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [isKicked, setIsKicked] = useState(false);

    // Poll State
    const [activePoll, setActivePoll] = useState<any>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Chat & Participants ka state
    const [participants, setParticipants] = useState<string[]>([]);
    const [chatMessages, setChatMessages] = useState<{ sender: string, text: string }[]>([]);

    // Pehle se login hai to check karo (session storage se)
    useEffect(() => {
        const savedName = sessionStorage.getItem('studentName');
        if (savedName) {
            setName(savedName);
            setIsJoined(true);
        }
    }, []);

    // Socket events handle karne ka main logic
    useEffect(() => {
        if (!socket) return;

        // Poll update aane pe state set karo. Naya poll hai to vote reset karo.
        socket.on('poll_update', (poll) => {
            setActivePoll((prev: any) => {
                // Agar poll ID change hua hai, tabi vote status reset karo
                if (poll && prev && poll.id !== prev.id) {
                    setHasVoted(false);
                    setSelectedOption(null);
                }

                // 1. Session Storage Check (Client Side Failsafe)
                if (poll) {
                    const localVote = sessionStorage.getItem(`voted_poll_${poll.id}`);
                    if (localVote) {
                        setHasVoted(true);
                        // Option index bhi save kar sakte hain agar chahiye, par abhi true bas hai button chupane ke liye
                        const savedOption = sessionStorage.getItem(`voted_option_${poll.id}`);
                        if (savedOption) setSelectedOption(parseInt(savedOption));
                    }
                }

                // Explicit check maaro agar poll aa gaya hai
                if (poll) {
                    const currentName = sessionStorage.getItem('studentName');
                    if (currentName) {
                        socket.emit('check_my_vote', { pollId: poll.id, studentName: currentName });
                    }
                }

                return poll;
            });
        });

        socket.on('poll_created', (poll) => { setActivePoll(poll); setHasVoted(false); setSelectedOption(null); });

        // Result update ho raha hai to bas votes update karo, baaki mat chhedna
        socket.on('poll_results_update', (results) => setActivePoll((prev: any) => prev ? { ...prev, votes: results } : prev));

        // Refresh Fix: Server batayega agar humne already vote diya hai
        socket.on('student_vote_status', (status: { hasVoted: boolean, optionIndex: number }) => {
            console.log("Received student_vote_status:", status);
            if (status.hasVoted) {
                setHasVoted(true);
                setSelectedOption(status.optionIndex);
            }
        });

        socket.on('participants_update', (list: string[]) => {
            setParticipants(list);
        });

        // Chat & Kick Logic
        socket.on('chat_message', (msg) => {
            setChatMessages(prev => [...prev, msg]);
        });

        socket.on('kick_student', (kickedName) => {
            // Agar mera naam hai kicked list me, to tata bye bye.
            if (kickedName === name || kickedName === sessionStorage.getItem('studentName')) {
                setIsKicked(true);
                sessionStorage.removeItem('studentName');
                // Abhi naam reset nahi kar rahe, taaki kicked screen dikha sakein
            }
        });

        // Agar refresh kiya to wapas join karwao server pe
        const savedName = sessionStorage.getItem('studentName');
        if (savedName) {
            socket.emit('join_session', savedName);
        }

        return () => {
            socket.off('poll_update');
            socket.off('poll_created');
            socket.off('poll_results_update');
            socket.off('student_vote_status');
            socket.off('chat_message');
            socket.off('kick_student');
            socket.off('participants_update');
        };
    }, [socket, name]);

    // Timer hook use kar rahe hain taaki automatically seconds kam hote dikhein
    const timeLeft = usePollTimer(activePoll?.startTime, activePoll?.timerDuration || 0);

    // Join button click karne pe
    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            // Session me save kar lo taaki refresh pe na ude
            sessionStorage.setItem('studentName', name);
            if (socket) socket.emit('join_session', name);
            setIsJoined(true);
        }
    };

    // Vote submit karne ka function
    const handleVote = () => {
        if (!socket || !activePoll || selectedOption === null) return;
        socket.emit('vote', { pollId: activePoll.id, studentName: name, optionIndex: selectedOption });

        // Optimistic update
        setHasVoted(true);

        // Save to session storage (Browser persistence)
        sessionStorage.setItem(`voted_poll_${activePoll.id}`, 'true');
        sessionStorage.setItem(`voted_option_${activePoll.id}`, selectedOption.toString());
    };

    // Agar kick ho gaya hai to sad screen dikhao
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

    // Agar join nahi kiya to login form dikhao
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

    // Main student view: Ya to waiting ya active poll
    return (
        <div className="min-h-screen bg-white font-sans relative">
            {/* Main Content Area */}
            {!activePoll ? (
                <WaitingScreen />
            ) : (
                <ActivePollView
                    activePoll={activePoll}
                    timeLeft={timeLeft}
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                    handleVote={handleVote}
                    hasVoted={hasVoted}
                />
            )}

            {/* Chat Floating Button */}
            {activePoll && (
                <StudentChatPanel
                    socket={socket}
                    name={name}
                    participants={participants}
                    chatMessages={chatMessages}
                />
            )}
        </div>
    );
};

export default Student;
