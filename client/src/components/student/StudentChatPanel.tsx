import React, { useRef, useState, useEffect } from 'react';
import { IoChatbubbleEllipsesSharp, IoClose, IoSend, IoPeople } from "react-icons/io5";

interface StudentChatPanelProps {
    socket: any;
    name: string;
    participants: string[];
    chatMessages: { sender: string, text: string }[];
}

export const StudentChatPanel: React.FC<StudentChatPanelProps> = ({ socket, name, participants, chatMessages }) => {
    const [showChat, setShowChat] = useState(false);
    const [chatTab, setChatTab] = useState<'chat' | 'participants'>('chat');
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showChat && chatTab === 'chat') {
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [chatMessages, showChat, chatTab]);

    const sendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() && socket) {
            socket.emit('chat_message', { sender: name, text: chatInput });
            setChatInput('');
        }
    }

    return (
        <>
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setShowChat(!showChat)}
                    className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                >
                    {showChat ? <IoClose size={24} /> : <IoChatbubbleEllipsesSharp size={24} />}
                </button>
            </div>

            {showChat && (
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
        </>
    );
};
