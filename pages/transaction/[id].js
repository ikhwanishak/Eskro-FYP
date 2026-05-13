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
    const [actionLoading, setActionLoading] = useState(false);
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
        setActionLoading(true);
        setError('');
        try {
            const challengeRes = await fetch('/api/auth/challenge');
            const { challenge } = await challengeRes.json();
            if (!challenge) throw new Error('Failed to generate security challenge');

            const res = await fetch('/api/transaction/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId: transaction.id, challenge }),
            });
            const data = await res.json();
            if (res.ok && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                throw new Error(data.error || 'Payment failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async (actionType) => {
        setActionLoading(true);
        setError('');
        try {
            // Step 1: Get single-use nonce (Replay Attack Protection)
            const nonceRes = await fetch('/api/transaction/action-nonce', { method: 'POST' });
            if (!nonceRes.ok) throw new Error('Failed to get security token. Please try again.');
            const { nonce } = await nonceRes.json();

            // Step 2: Submit action with nonce
            const res = await fetch('/api/transaction/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId: transaction.id, action: actionType, nonce }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Action failed');
            setTransaction(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (userLoading || loading) {
        return <Layout><div className="text-center mt-10">Loading...</div></Layout>;
    }
    if (error && !transaction) {
        return <Layout><div className="text-center mt-10 text-red-500">{error}</div></Layout>;
    }

    const isCreator = user.email === transaction.creatorEmail;
    const isBuyer = (transaction.role === 'buyer' && isCreator) || (transaction.role === 'seller' && !isCreator);

    const getBadgeVariant = (status) => {
        switch (status) {
            case 'completed': return 'green';
            case 'paid': return 'blue';
            case 'disputed': return 'red';
            case 'refunded': return 'purple';
            case 'canceled': return 'red';
            default: return 'yellow';
        }
    };

    const renderActionSection = () => {
        if (transaction.status === 'pending') {
            return (
                <div className="space-y-4">
                    {isBuyer && (
                        <Button className="w-full btn-accent" onClick={handlePay} isLoading={actionLoading}>
                            Pay Now (RM {(transaction.amount + transaction.fee).toFixed(2)})
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => handleAction('cancel')}
                        isLoading={actionLoading}
                    >
                        Cancel Transaction
                    </Button>
                </div>
            );
        }

        if (transaction.status === 'paid') {
            if (isBuyer) {
                return (
                    <div className="space-y-3 border border-blue-200 bg-blue-50 p-6 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-1">📦 Has the item arrived?</p>
                        <p className="text-sm text-blue-800 mb-4">
                            Please confirm receipt only when you have received and verified the item. This will release the funds securely to the seller.
                        </p>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white border-none"
                            onClick={() => {
                                if (confirm('Are you sure you want to release the funds? This action cannot be undone.')) {
                                    handleAction('release');
                                }
                            }}
                            isLoading={actionLoading}
                        >
                            ✅ Confirm Receipt &amp; Release Funds
                        </Button>

                        {/* RAISE DISPUTE BUTTON */}
                        <div className="border-t border-blue-100 pt-4 mt-2">
                            <p className="text-xs text-gray-500 mb-2 text-center">
                                Problem with the item? You can raise a dispute for admin review.
                            </p>
                            <button
                                disabled={actionLoading}
                                onClick={() => {
                                    if (confirm('Are you sure you want to raise a dispute? Admin will be notified to investigate and resolve this transaction.')) {
                                        handleAction('dispute');
                                    }
                                }}
                                className="w-full border-2 border-red-300 text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-50 cursor-pointer"
                            >
                                ⚠️ Raise Dispute — Item Not Received / Damaged
                            </button>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="border border-yellow-200 bg-yellow-50 p-6 rounded-lg text-center">
                        <p className="text-sm font-semibold text-yellow-900 mb-2">💰 Payment secured in Escrow</p>
                        <p className="text-sm text-yellow-800">
                            Please ship or deliver the item. We are waiting for the buyer to confirm receipt before releasing the funds to you.
                        </p>
                    </div>
                );
            }
        }

        if (transaction.status === 'disputed') {
            return (
                <div className="bg-red-50 border-2 border-red-300 p-6 rounded-lg text-center space-y-3">
                    <p className="text-2xl">⚡</p>
                    <p className="font-bold text-red-800 text-lg">Transaction Under Dispute</p>
                    <p className="text-sm text-red-700">
                        This transaction has been flagged for review. Our admin team will investigate and resolve this dispute. <strong>Funds are frozen</strong> until a decision is made.
                    </p>
                    <div className="bg-red-100 rounded-lg px-4 py-2 text-xs text-red-600 font-medium">
                        ⏳ Awaiting Admin Resolution
                    </div>
                </div>
            );
        }

        if (transaction.status === 'refunded') {
            return (
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg text-center">
                    <p className="font-bold text-purple-800 text-lg mb-1">↩ Transaction Refunded</p>
                    <p className="text-sm text-purple-700">
                        Admin has resolved this dispute in favour of the buyer. The refund amount has been credited to the buyer&#39;s wallet.
                    </p>
                </div>
            );
        }

        if (transaction.status === 'completed') {
            return (
                <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                    <p className="font-bold text-green-800 text-lg mb-1">✅ Transaction Complete</p>
                    <p className="text-sm text-green-700">Funds have been successfully released to the seller&#39;s wallet.</p>
                </div>
            );
        }

        if (transaction.status === 'canceled') {
            return (
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
                    <p className="font-bold text-red-800 text-lg mb-1">❌ Transaction Canceled</p>
                    <p className="text-sm text-red-700">This transaction has been voided.</p>
                </div>
            );
        }

        return <div className="text-center text-muted bg-gray-50 p-4 rounded-md">No action required at this moment.</div>;
    };

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
                            <Badge variant={getBadgeVariant(transaction.status)}>
                                {transaction.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>You are verified as:</strong> {user.email}
                        </p>
                    </div>

                    <div className="mt-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>
                        )}
                        {renderActionSection()}
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
