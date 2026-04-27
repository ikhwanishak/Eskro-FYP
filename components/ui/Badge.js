import React from 'react';

export default function Badge({ children, variant = 'gray', className = '' }) {
    const variantClass = {
        yellow: 'badge-yellow',
        green: 'badge-green',
        red: 'badge-red',
        gray: 'bg-gray-100 text-gray-800',
    }[variant] || 'bg-gray-100 text-gray-800';

    return (
        <span className={`badge ${variantClass} ${className}`}>
            {children}
        </span>
    );
}
