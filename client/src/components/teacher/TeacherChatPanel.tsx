import React, { useEffect, useRef, useState } from 'react';
import { IoSend, IoPeople, IoClose, IoChatbubbleEllipsesSharp } from "react-icons/io5";

interface TeacherChatPanelProps {
    socket: any;
    participants: string[];
    chatMessages: { sender: string, text: string }[];
}

export const TeacherChatPanel: React.FC<TeacherChatPanelProps> = ({ socket, participants, chatMessages }) => {
    const [showChatPanel, setShowChatPanel] = useState(false);
    const [chatTab, setChatTab] = useState<'chat' | 'participants'>('chat');
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showChatPanel && chatTab === 'chat') {
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [chatMessages, showChatPanel, chatTab]);

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

    return (
        <>
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

            <div className="fixed bottom-24 right-6 z-50 transition-all duration-300">
                <button
                    onClick={() => setShowChatPanel(!showChatPanel)}
                    className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                >
                    {showChatPanel ? <IoClose size={24} /> : <IoChatbubbleEllipsesSharp size={24} />}
                </button>
            </div>
        </>
    );
};
