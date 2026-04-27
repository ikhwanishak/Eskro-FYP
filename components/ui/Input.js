import React from 'react';

export default function Input({ label, error, className = '', ...props }) {
    return (
        <div className={`input-group ${className}`}>
            {label && <label className="label">{label}</label>}
            <input className={`input ${error ? 'border-red-500' : ''}`} {...props} />
            {error && <span className="text-sm text-red-500 mt-1 block">{error}</span>}
        </div>
    );
}
