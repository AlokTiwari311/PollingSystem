import React from 'react';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white rounded-3xl p-8 shadow-xl border border-gray-100 ${className}`}>
            {children}
        </div>
    );
};
