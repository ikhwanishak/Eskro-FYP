import React from 'react';
import Link from 'next/link';
import Button from './ui/Button';
import { useRouter } from 'next/router';
import useUser from '../lib/useUser';

export default function Header() {
    // Header component
    const router = useRouter();
    const { user } = useUser();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        // Force reload to clear state if needed, or rely on hook re-render
        window.location.href = '/login';
    };

    return (
        <header className="header container flex items-center justify-between px-4 py-4 sm:px-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="logo flex-shrink-0">
                <Link href="/" className="flex items-center gap-2 no-underline text-xl font-bold text-gray-800">
                    EscrowSecure
                </Link>
            </div>

            <nav className="flex items-center gap-3 sm:gap-6">
                {user ? (
                    <>
                        <Link href="/dashboard" className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-blue-600 no-underline">
                            Dashboard
                        </Link>
                        <Link href="/transaction/create" className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-blue-600 no-underline">
                            New
                        </Link>
                        {user.isAdmin && (
                            <Link href="/admin/dashboard" className="text-xs sm:text-sm font-semibold text-red-600 hover:text-red-800 no-underline">
                                Admin
                            </Link>
                        )}

                        <div className="flex items-center gap-2 ml-2">
                            <span className="hidden lg:block text-xs text-gray-400 font-medium">{user.email}</span>
                            <button 
                                onClick={handleLogout}
                                className="text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-800 no-underline px-4 py-2">
                            Login
                        </Link>
                        <Link href="/register">
                            <Button variant="primary" className="text-sm">Get Started</Button>
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
