import React from 'react';

export default function GlassCard({ children, className = '', hover = true, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`
        glassmorphic rounded-2xl p-6
        ${hover ? 'transition-all duration-300 hover:scale-105 hover:shadow-glow-md cursor-pointer' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
