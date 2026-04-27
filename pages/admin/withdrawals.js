import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import useUser from '../../lib/useUser';

export default function AdminWithdrawals() {
    const { user } = useUser({ redirectTo: '/login' });
    const [withdrawals, setWithdrawals] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchWithdrawals = () => {
        if (user?.isAdmin) {
            fetch('/api/admin/withdrawals')
                .then(res => res.json())
                .then(data => Array.isArray(data) ? setWithdrawals(data) : setWithdrawals([]));
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [user]);

    if (!user?.isAdmin) return null;

    const handleWithdrawalAction = async (withdrawalId, action) => {
        const label = action === 'approve' ? 'Approve' : 'Reject';
        if (!confirm(`Confirm: ${label} this withdrawal request?`)) return;

        setActionLoading(withdrawalId);
        try {
            const res = await fetch('/api/admin/withdrawal-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ withdrawalId, action })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(`Error: ${data.error}`);
            } else {
                const msg = action === 'approve'
                    ? '✅ Withdrawal approved! Please process bank transfer manually.'
                    : '❌ Withdrawal rejected. Amount has been refunded to user wallet.';
                alert(msg);
                fetchWithdrawals();
            }
        } catch (err) {
            alert('Server error. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' })
            .format(amount).replace('MYR', 'RM');

    const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

    return (
        <Layout title="Withdrawal Requests — Admin">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">💳 Withdrawal Requests</h1>
                    {pendingCount > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 text-sm font-bold px-4 py-1.5 rounded-full">
                            ⏳ {pendingCount} Pending Approval
                        </span>
                    )}
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3 font-semibold text-gray-600">ID</th>
                                    <th className="p-3 font-semibold text-gray-600">User</th>
                                    <th className="p-3 font-semibold text-gray-600">Bank</th>
                                    <th className="p-3 font-semibold text-gray-600">Account No.</th>
                                    <th className="p-3 font-semibold text-gray-600">Amount</th>
                                    <th className="p-3 font-semibold text-gray-600">Status</th>
                                    <th className="p-3 font-semibold text-gray-600">Date</th>
                                    <th className="p-3 font-semibold text-gray-600 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map(w => {
                                    const isPending = w.status === 'pending';
                                    const isBeingActioned = actionLoading === w.id;
                                    return (
                                        <tr
                                            key={w.id}
                                            className={`border-b transition ${isPending ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="p-3 text-xs font-mono text-gray-500">{w.id.slice(0, 8)}</td>
                                            <td className="p-3 text-xs text-gray-700 max-w-[140px] truncate" title={w.user?.email}>{w.user?.email}</td>
                                            <td className="p-3 font-medium">{w.bankName}</td>
                                            <td className="p-3 font-mono text-sm">{w.accountNumber}</td>
                                            <td className="p-3 font-bold text-gray-800">{formatCurrency(w.amount)}</td>
                                            <td className="p-3">
                                                <Badge variant={
                                                    w.status === 'approved' ? 'green' :
                                                    w.status === 'rejected' ? 'red' :
                                                    'yellow'
                                                }>
                                                    {w.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-xs text-gray-500">{new Date(w.createdAt).toLocaleDateString('ms-MY')}</td>
                                            <td className="p-3 text-center">
                                                {isPending ? (
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            disabled={isBeingActioned}
                                                            onClick={() => handleWithdrawalAction(w.id, 'approve')}
                                                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer border-none"
                                                        >
                                                            {isBeingActioned ? '...' : '✅ Approve'}
                                                        </button>
                                                        <button
                                                            disabled={isBeingActioned}
                                                            onClick={() => handleWithdrawalAction(w.id, 'reject')}
                                                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer border-none"
                                                        >
                                                            {isBeingActioned ? '...' : '❌ Reject'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        {w.status === 'approved' ? '✅ Processed' : '❌ Rejected'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {withdrawals.length === 0 && (
                            <div className="text-center py-12 text-gray-400">No withdrawal requests found.</div>
                        )}
                    </div>
                </Card>

                <div className="mt-4 text-xs text-gray-400 bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3">
                    ℹ️ <strong>Note:</strong> Approving a withdrawal marks it as processed in the system. Please perform the actual bank transfer manually and keep proof for records.
                    Rejecting a withdrawal will automatically refund the amount back to the user&#39;s wallet.
                </div>
            </div>
        </Layout>
    );
}
