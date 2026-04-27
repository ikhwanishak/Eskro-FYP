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
            <h1 className="text-2xl font-bold mb-6">All Users</h1>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Email</th>
                                <th className="p-2">Joined</th>
                                <th className="p-2">Auth Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2">{u.email}</td>
                                    <td className="p-2 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="p-2">
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
        </Layout>
    );
}
