import React from 'react';

export default function Button({
    children,
    variant = 'primary',
    className = '',
    isLoading = false,
    disabled,
    ...props
}) {
    const baseClass = 'btn';
    const variantClass = {
        primary: 'btn-primary',
        accent: 'btn-accent',
        outline: 'btn-outline',
        danger: 'btn-danger', // Need to add this to globals.css
    }[variant] || 'btn-primary';

    return (
        <button
            className={`${baseClass} ${variantClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </button>
    );
}
