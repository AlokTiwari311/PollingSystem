import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSparklesSharp } from "react-icons/io5";

export const Landing = () => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);

    const handleContinue = () => {
        if (selectedRole) {
            navigate(`/${selectedRole}`);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans p-8">
            <div className="max-w-6xl mx-auto">
                {/* Logo Section */}
                <div className="mb-12">
                    <div className="inline-flex items-center">
                        <span className="text-orange-400 mr-2 text-xl"><IoSparklesSharp /></span>

                        <span className="text-gray font-bold text-lg tracking-tight">Intervue Poll</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6 mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-black tracking-tight">
                        Welcome to the Live Polling System
                    </h1>
                    <p className="text-black text-lg">
                        Please select the role that best describes you to begin using the live polling system
                    </p>
                </div>

                {/* Role Selection Grid */}
                <div className="flex flex-col md:flex-row gap-0 w-full mb-8">
                    {/* Student Box */}
                    <button
                        onClick={() => setSelectedRole('student')}
                        className={`text-left p-12 border transition-all duration-200 w-full md:w-1/2 h-64 flex flex-col justify-center relative ${selectedRole === 'student'
                            ? 'border-black z-10 bg-gray-50'
                            : 'border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <h2 className="text-2xl font-bold text-black mb-4 mx-auto text-center w-full">I'm a Student</h2>
                        <p className="text-gray-medium text-center">
                            Lorem Ipsum is simply dummy text of the printing and typesetting industry
                        </p>
                    </button>

                    {/* Teacher Box */}
                    <button
                        onClick={() => setSelectedRole('teacher')}
                        className={`text-left p-12 border border-l-0 transition-all duration-200 w-full md:w-1/2 h-64 flex flex-col justify-center relative ${selectedRole === 'teacher'
                            ? 'border-black z-10 bg-gray-50'
                            : 'border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <h2 className="text-2xl font-bold text-black mb-4 mx-auto text-center w-full">I'm a Teacher</h2>
                        <p className="text-gray-medium text-center">
                            Submit answers and view live poll results in real time.
                        </p>
                    </button>
                </div>

                {/* Footer Action */}
                <div>
                    <button
                        onClick={handleContinue}
                        disabled={!selectedRole}
                        className={`px-8 py-3 font-medium rounded text-sm transition-colors ${selectedRole
                            ? 'bg-primary text-white hover:bg-primary-dark shadow-md'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};
