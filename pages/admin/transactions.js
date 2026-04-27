import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import useUser from '../../lib/useUser';

export default function AdminTransactions() {
    const { user } = useUser({ redirectTo: '/login' });
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        if (user?.isAdmin) {
            fetch('/api/admin/transactions')
                .then(res => res.json())
                .then(setTransactions);
        }
    }, [user]);

    if (!user?.isAdmin) return null;

    return (
        <Layout title="All Transactions">
            <h1 className="text-2xl font-bold mb-6">All Transactions</h1>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">ID</th>
                                <th className="p-2">Item</th>
                                <th className="p-2">Amount</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Creator</th>
                                <th className="p-2">Target</th>
                                <th className="p-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 text-xs font-mono">{tx.id.slice(0, 8)}</td>
                                    <td className="p-2">{tx.item}</td>
                                    <td className="p-2">RM {tx.amount.toFixed(2)}</td>
                                    <td className="p-2">
                                        <Badge variant={tx.status === 'paid' ? 'green' : 'yellow'}>
                                            {tx.status}
                                        </Badge>
                                    </td>
                                    <td className="p-2 text-sm">{tx.creatorEmail}</td>
                                    <td className="p-2 text-sm">{tx.targetEmail}</td>
                                    <td className="p-2 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </Layout>
    );
}
