import React from 'react';

export default function Button({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    type = 'button'
}) {
    const baseClasses = 'font-semibold rounded-xl transition-all duration-300 transform';

    const variants = {
        primary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-glow-md hover:scale-105 active:scale-95',
        secondary: 'glassmorphic text-white hover:bg-white/20 hover:shadow-glass',
        outline: 'border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
        >
            {children}
        </button>
    );
}
