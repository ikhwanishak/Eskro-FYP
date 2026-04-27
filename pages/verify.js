import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Verify() {
    const router = useRouter();
    const { token } = router.query;
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (token) {
            verifyToken(token);
        }
    }, [token]);

    const verifyToken = async (token) => {
        try {
            const res = await fetch('/api/auth/verify-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage('Email verified successfully!');
                // Redirect to register page (or login if recovery) after 2 seconds
                setTimeout(() => {
                    // We redirect to register, but the register page needs to know we are verified.
                    // The session now has email_verified = true.
                    const nextPath = router.query.next || '/register';
                    router.push(`${nextPath}?verified=true`);
                }, 2000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Verification failed');
            }
        } catch (error) {
            setStatus('error');
            setMessage('An error occurred');
        }
    };

    return (
        <Layout title="Verify Email">
            <div className="max-w-md mx-auto mt-10">
                <Card title="Email Verification">
                    <div className="text-center py-6">
                        {status === 'verifying' && (
                            <div className="animate-pulse text-blue-600 font-medium">
                                {message}
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="text-green-600 font-bold text-lg">
                                ✅ {message}
                                <p className="text-sm text-gray-500 mt-2 font-normal">Redirecting...</p>
                            </div>
                        )}
                        {status === 'error' && (
                            <div>
                                <div className="text-red-600 font-bold text-lg mb-4">
                                    ❌ {message}
                                </div>
                                <Button onClick={() => router.push('/register')}>
                                    Back to Register
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
