import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/router';
import useUser from '../lib/useUser';

export default function Register() {
    const router = useRouter();
    const { verified } = router.query;

    const [email, setEmail] = useState('');
    const [step, setStep] = useState('input_email'); // input_email, email_sent, ready_to_register
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user } = useUser({ redirectTo: '/dashboard', redirectIfFound: true });

    useEffect(() => {
        if (verified === 'true') {
            setStep('ready_to_register');
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => {
                    const sessionEmail = data.email || (data.user && data.user.email);
                    if (sessionEmail) setEmail(sessionEmail);
                });
        }
    }, [verified]);

    const handleSendMagicLink = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/send-magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setStep('email_sent');
            } else {
                throw new Error(data.error || 'Failed to send verification link');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        try {
            const optionsRes = await fetch('/api/auth/register-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const options = await optionsRes.json();
            if (options.error) throw new Error(options.error);

            const attResp = await startRegistration(options);

            const verifyRes = await fetch('/api/auth/verify-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attResp),
            });
            const verification = await verifyRes.json();

            if (verification.verified) {
                router.push('/dashboard');
            } else {
                throw new Error(verification.error || 'Registration failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Create Account - EscrowSecure">
            <div className="w-full max-w-lg mx-auto">
                <Card>
                    <h1 className="mb-2">Create Account</h1>

                    {step === 'input_email' && (
                        <>
                            <p className="text-muted mb-8">
                                Enter your email to verify your identity. We'll send you a magic link.
                            </p>
                            <form onSubmit={handleSendMagicLink}>
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
                                {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
                                <Button type="submit" className="btn-primary" isLoading={loading}>
                                    Verify Email
                                </Button>
                            </form>
                        </>
                    )}

                    {step === 'email_sent' && (
                        <div className="text-center py-4">
                            <div className="text-5xl mb-4">✉️</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">Link Sent!</h3>
                            <p className="text-muted mb-6">
                                Please check <strong>{email}</strong> to complete your account creation.
                            </p>
                            <Button variant="secondary" className="btn-secondary" onClick={() => setStep('input_email')}>
                                Use different email
                            </Button>
                        </div>
                    )}

                    {step === 'ready_to_register' && (
                        <div className="text-center py-4">
                            <div className="text-5xl mb-4">✅</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">Email Verified</h3>
                            <p className="text-muted mb-6">
                                You can now create a passkey for <strong>{email}</strong>.
                            </p>
                            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
                            <Button className="btn-primary" onClick={handleRegister} isLoading={loading}>
                                Create Passkey & Register
                            </Button>
                        </div>
                    )}

                </Card>
            </div>
        </Layout>
    );
}
