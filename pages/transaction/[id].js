import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import useUser from '../../lib/useUser';
import { useRouter } from 'next/router';

export default function TransactionDetails() {
    const { user, loading: userLoading } = useUser({ redirectTo: '/login' });
    const router = useRouter();
    const { id } = router.query;

    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [payLoading, setPayLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && id) {
            fetch(`/api/transaction/${id}`)
                .then((res) => {
                    if (!res.ok) throw new Error('Failed to load transaction');
                    return res.json();
                })
                .then((data) => {
                    setTransaction(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [user, id]);

    const handlePay = async () => {
        setPayLoading(true);
        setError('');

        try {
            // 1. Get fresh challenge for Replay Protection
            const challengeRes = await fetch('/api/auth/challenge');
            const { challenge } = await challengeRes.json();

            if (!challenge) throw new Error('Failed to generate security challenge');

            // 2. Send Payment Request
            const res = await fetch('/api/transaction/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionId: transaction.id,
                    challenge
                }),
            });

            const data = await res.json();

            if (res.ok && data.paymentUrl) {
                // Redirect to ToyyibPay checkout page
                window.location.href = data.paymentUrl;
            } else {
                throw new Error(data.error || 'Payment failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setPayLoading(false);
        }
    };

    if (userLoading || loading) {
        return <Layout><div className="text-center mt-10">Loading...</div></Layout>;
    }

    if (error && !transaction) {
        return <Layout><div className="text-center mt-10 text-red-500">{error}</div></Layout>;
    }

    // Determine Role Logic
    const isCreator = user.email === transaction.creatorEmail;
    const isBuyer = (transaction.role === 'buyer' && isCreator) || (transaction.role === 'seller' && !isCreator);

    return (
        <Layout title={`Transaction #${transaction.id.slice(0, 8)}`}>
            <div className="max-w-2xl mx-auto">
                <Card title="Transaction Details">
                    <div className="mb-2 text-sm text-muted">Transaction ID: {transaction.id}</div>

                    <div className="grid grid-cols-2 gap-4 mb-6 border-b border-gray-100 pb-6">
                        <div>
                            <label className="label text-sm text-muted">Item</label>
                            <div className="font-bold text-lg">{transaction.item}</div>
                        </div>
                        <div className="text-right">
                            <label className="label text-sm text-muted">Amount</label>
                            <div className="font-bold text-lg">RM {transaction.amount.toFixed(2)}</div>
                        </div>
                        <div>
                            <label className="label text-sm text-muted">Platform Fee (2.5%)</label>
                            <div>RM {transaction.fee.toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                            <label className="label text-sm text-muted">Status</label>
                            <Badge variant={transaction.status === 'paid' ? 'green' : 'yellow'}>
                                {transaction.status === 'paid' ? 'Paid' : 'Pending Payment'}
                            </Badge>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>You are verified as:</strong> {user.email}
                        </p>
                    </div>

                    {/* Action Section */}
                    <div className="mt-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                                {error}
                            </div>
                        )}

                        {isBuyer && transaction.status === 'pending' ? (
                            <Button
                                className="w-full btn-accent"
                                onClick={handlePay}
                                isLoading={payLoading}
                            >
                                Pay Now (RM {(transaction.amount + transaction.fee).toFixed(2)})
                            </Button>
                        ) : (
                            <div className="text-center text-muted bg-gray-50 p-4 rounded-md">
                                No action required at this moment.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
