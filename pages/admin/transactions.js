import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import useUser from '../../lib/useUser';

export default function AdminTransactions() {
    const { user } = useUser({ redirectTo: '/login' });
    const [transactions, setTransactions] = useState([]);
    const [actionLoading, setActionLoading] = useState(null); // stores transactionId being actioned

    const fetchTransactions = () => {
        if (user?.isAdmin) {
            fetch('/api/admin/transactions')
                .then(res => res.json())
                .then(data => Array.isArray(data) ? setTransactions(data) : setTransactions([]));
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    if (!user?.isAdmin) return null;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return 'green';
            case 'paid': return 'blue';
            case 'disputed': return 'red';
            case 'refunded': return 'purple';
            case 'canceled': return 'gray';
            default: return 'yellow';
        }
    };

    const handleResolve = async (transactionId, action) => {
        const actionLabel = action === 'refund' ? 'Refund to Buyer' : 'Force Release to Seller';
        if (!confirm(`Confirm: ${actionLabel}?\n\nThis action is irreversible and will be logged in the Audit Trail.`)) return;

        setActionLoading(transactionId);
        try {
            const res = await fetch('/api/admin/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId, action })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(`Error: ${data.error}`);
            } else {
                alert(`✅ Done! Transaction has been ${action === 'refund' ? 'refunded to buyer' : 'force released to seller'}.`);
                fetchTransactions(); // Refresh list
            }
        } catch (err) {
            alert('Server error. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const disputedCount = transactions.filter(tx => tx.status === 'disputed').length;

    return (
        <Layout title="Manage Transactions — Admin">
            <div className="w-full max-w-7xl mx-auto px-2">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Manage Transactions</h1>
                    {disputedCount > 0 && (
                        <span className="bg-red-100 text-red-700 text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-2">
                            ⚡ {disputedCount} Dispute{disputedCount > 1 ? 's' : ''} Pending Resolution
                        </span>
                    )}
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3 font-semibold text-gray-600">ID</th>
                                    <th className="p-3 font-semibold text-gray-600">Item</th>
                                    <th className="p-3 font-semibold text-gray-600">Amount</th>
                                    <th className="p-3 font-semibold text-gray-600">Status</th>
                                    <th className="p-3 font-semibold text-gray-600">Buyer</th>
                                    <th className="p-3 font-semibold text-gray-600">Seller</th>
                                    <th className="p-3 font-semibold text-gray-600">Date</th>
                                    <th className="p-3 font-semibold text-gray-600 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => {
                                    const buyerEmail = tx.role === 'buyer' ? tx.creatorEmail : tx.targetEmail;
                                    const sellerEmail = tx.role === 'seller' ? tx.creatorEmail : tx.targetEmail;
                                    const isDisputed = tx.status === 'disputed';
                                    const isBeingActioned = actionLoading === tx.id;

                                    return (
                                        <tr
                                            key={tx.id}
                                            className={`border-b transition ${isDisputed ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="p-3 text-xs font-mono text-gray-500">{tx.id.slice(0, 8)}</td>
                                            <td className="p-3 font-medium">{tx.item}</td>
                                            <td className="p-3">RM {tx.amount.toFixed(2)}</td>
                                            <td className="p-3">
                                                <Badge variant={getStatusBadge(tx.status)}>
                                                    {tx.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-xs text-gray-600 max-w-[120px] truncate" title={buyerEmail}>{buyerEmail}</td>
                                            <td className="p-3 text-xs text-gray-600 max-w-[120px] truncate" title={sellerEmail}>{sellerEmail}</td>
                                            <td className="p-3 text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('ms-MY')}</td>
                                            <td className="p-3 text-center">
                                                {isDisputed ? (
                                                    <div className="flex gap-2 justify-center flex-wrap">
                                                        <button
                                                            disabled={isBeingActioned}
                                                            onClick={() => handleResolve(tx.id, 'refund')}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer border-none"
                                                        >
                                                            {isBeingActioned ? '...' : '↩ Refund Buyer'}
                                                        </button>
                                                        <button
                                                            disabled={isBeingActioned}
                                                            onClick={() => handleResolve(tx.id, 'force_release')}
                                                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer border-none"
                                                        >
                                                            {isBeingActioned ? '...' : '🚀 Force Release'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {transactions.length === 0 && (
                            <div className="text-center py-12 text-gray-400">No transactions found.</div>
                        )}
                    </div>
                </Card>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    <span>Admin Actions (for disputed transactions only):</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">↩ Refund Buyer</span>
                    <span className="text-gray-400">= Credit buyer wallet + mark refunded</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-semibold">🚀 Force Release</span>
                    <span className="text-gray-400">= Credit seller wallet + mark completed</span>
                </div>
            </div>
        </Layout>
    );
}
