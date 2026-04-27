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
        <header className="header container" style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1rem' }}>
            <div className="logo">
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    EscrowSecure
                </Link>
            </div>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {user ? (
                    <>
                        <Link href="/dashboard" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Dashboard
                        </Link>
                        <Link href="/transaction/create" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            New Transaction
                        </Link>
                        {/* Conditional Admin Link */}
                        {user.isAdmin && (
                            <Link href="/admin/dashboard" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#dc2626' }}>
                                Admin Panel
                            </Link>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>{user.email}</span>
                            <Button variant="outline" onClick={handleLogout} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Logout</Button>
                        </div>
                    </>
                ) : (
                    <>
                        <Link href="/login" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#4b5563', padding: '0.5rem 1rem' }}>
                            Login
                        </Link>
                        <Link href="/register">
                            <Button variant="primary">Get Started</Button>
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
