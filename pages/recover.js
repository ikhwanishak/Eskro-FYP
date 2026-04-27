import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/router';
import useUser from '../lib/useUser';

export default function Recover() {
    const router = useRouter();
    const { verified } = router.query;

    const [email, setEmail] = useState('');
    const [step, setStep] = useState('input_email'); // input_email, email_sent, ready_to_recover
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user } = useUser({ redirectTo: '/dashboard', redirectIfFound: true });

    useEffect(() => {
        if (verified === 'true') {
            setStep('ready_to_recover');
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => {
                    const sessionEmail = data.email || (data.user && data.user.email);
                    if (sessionEmail) {
                        setEmail(sessionEmail);
                    }
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
                body: JSON.stringify({ email, next: '/recover' }),
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

    const handleRecover = async () => {
        setLoading(true);
        setError('');

        try {
            // 1. Get options from server
            const optionsRes = await fetch('/api/auth/register-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const options = await optionsRes.json();

            if (options.error) {
                throw new Error(options.error);
            }

            // 2. Start WebAuthn Attestation
            const attResp = await startRegistration(options);

            // 3. Verify with server
            const verifyRes = await fetch('/api/auth/verify-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attResp),
            });

            const verification = await verifyRes.json();

            if (verification.verified) {
                router.push('/dashboard');
            } else {
                throw new Error(verification.error || 'Recovery failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Recovery failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Recover Account - EscrowSecure">
            <div className="w-full max-w-lg mx-auto">
                <Card>
                    <h1 className="mb-2">Recover Account</h1>

                    {step === 'input_email' && (
                        <>
                            <p className="text-muted mb-8">
                                Lost your passkey? Enter your email to verify your identity and add a new passkey.
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
                                    Send Recovery Link
                                </Button>
                            </form>
                        </>
                    )}

                    {step === 'email_sent' && (
                        <div className="text-center py-4">
                            <div className="text-5xl mb-4">✉️</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">Link Sent!</h3>
                            <p className="text-muted mb-6">
                                We sent a recovery link to <strong>{email}</strong>.<br />
                                Click the link to continue.
                            </p>
                            <Button variant="secondary" className="btn-secondary" onClick={() => setStep('input_email')}>
                                Use different email
                            </Button>
                        </div>
                    )}

                    {step === 'ready_to_recover' && (
                        <div className="text-center py-4">
                            <div className="text-5xl mb-4">✅</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">Email Verified</h3>
                            <p className="text-muted mb-6">
                                You can now create a <strong>new passkey</strong> for <strong>{email}</strong>.
                            </p>
                            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
                            <Button className="btn-primary" onClick={handleRecover} isLoading={loading}>
                                Create New Passkey
                            </Button>
                        </div>
                    )}

                </Card>
            </div>
        </Layout>
    );
}
