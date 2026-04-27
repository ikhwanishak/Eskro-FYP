import React, { useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'next/router';
import useUser from '../lib/useUser';

export default function Login() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const { user } = useUser({ redirectTo: '/dashboard', redirectIfFound: true });
    
    // Check for expired session flag
    React.useEffect(() => {
        if (router.query.expired === '1') {
            setError('Your session has expired due to inactivity. Please log in again.');
            // Remove the query param from URL without refreshing
            router.replace('/login', undefined, { shallow: true });
        }
    }, [router.query.expired]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Get options from server
            const optionsRes = await fetch('/api/auth/login-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const options = await optionsRes.json();

            if (options.error) {
                throw new Error(options.error);
            }

            // 2. Start WebAuthn Assertion
            const asseResp = await startAuthentication(options);

            // 3. Verify with server
            const verifyRes = await fetch('/api/auth/verify-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(asseResp),
            });

            const verification = await verifyRes.json();

            if (verification.verified) {
                if (verification.isAdmin) {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/dashboard');
                }
            } else {
                throw new Error(verification.error || 'Verification failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Login - EscrowSecure">
            <div className="w-full max-w-lg mx-auto">
                <Card>
                    <h1 className="mb-2">Login</h1>
                    <p className="text-muted mb-8">
                        Enter your email to login securely using your device's passkey.
                    </p>

                    <form onSubmit={handleLogin}>
                        <div className="mb-6">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="btn-primary" isLoading={loading}>
                            Continue with Passkey
                        </Button>

                        <div className="mt-4">
                            <a href="/recover" className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>
                                Lost your passkey?
                            </a>
                        </div>
                    </form>
                </Card>
            </div>
        </Layout>
    );
}
