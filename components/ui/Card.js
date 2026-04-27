import React from 'react';

export default function Card({ children, className = '', title }) {
    return (
        <div className={`card ${className}`}>
            {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
            {children}
        </div>
    );
}
