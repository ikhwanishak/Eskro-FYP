import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import useUser from '../../lib/useUser';

export default function AdminUsers() {
    const { user } = useUser({ redirectTo: '/login' });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (user?.isAdmin) {
            fetch('/api/admin/users')
                .then(res => res.json())
                .then(setUsers);
        }
    }, [user]);

    if (!user?.isAdmin) return null;

    return (
        <Layout title="All Users">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold mb-6 text-gray-900">All Users</h1>
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Joined</th>
                                    <th className="p-3 text-center">Auth Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-sm text-gray-700 font-medium">{u.email}</td>
                                        <td className="p-3 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3 text-center">
                                            {u.passkeyRegistered ? (
                                                <Badge variant="green">Passkey Active</Badge>
                                            ) : (
                                                <Badge variant="gray">No Passkey</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
