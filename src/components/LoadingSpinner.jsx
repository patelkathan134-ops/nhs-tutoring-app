import React from 'react';

export default function LoadingSpinner({ size = 'md' }) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <div className="flex items-center justify-center">
            <div className={`${sizeClasses[size]} relative`}>
                <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-md animate-pulse"></div>
            </div>
        </div>
    );
}
