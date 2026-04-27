import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
            <div className="container text-center text-sm text-muted">
                &copy; {new Date().getFullYear()} EscrowSecure. All rights reserved.
            </div>
        </footer>
    );
}
