import React from 'react';

export default function Select({ label, error, options = [], className = '', ...props }) {
    return (
        <div className={`input-group ${className}`}>
            {label && <label className="label">{label}</label>}
            <select className={`select ${error ? 'border-red-500' : ''}`} {...props}>
                <option value="" disabled>Select an option</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span className="text-sm text-red-500 mt-1 block">{error}</span>}
        </div>
    );
}
