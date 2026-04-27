import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import useUser from '../../lib/useUser';

export default function AdminSecurity() {
    const { user } = useUser({ redirectTo: '/login' });
    const [data, setData] = useState(null);

    useEffect(() => {
        if (user?.isAdmin) {
            fetch('/api/admin/security')
                .then(res => res.json())
                .then(setData);
        }
    }, [user]);

    if (!user?.isAdmin || !data) return null;

    return (
        <Layout title="Security Monitoring">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
                <h1 className="text-2xl font-bold mb-6 text-red-700">Security Monitoring</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card title="Total Login Attempts">
                        <div className="text-4xl font-bold">{data.totalLogins}</div>
                    </Card>
                    <Card title="Blocked Replay Attacks">
                        <div className="text-4xl font-bold text-red-600">{data.totalReplays}</div>
                    </Card>
                </div>

                <Card title="Replay Attack Attempts (Blocked)" className="mb-8">
                    {data.replayAttacks.length === 0 ? (
                        <p className="text-muted">No replay attacks detected.</p>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2">Timestamp</th>
                                    <th className="p-2">User</th>
                                    <th className="p-2">Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.replayAttacks.map(log => (
                                    <tr key={log.id} className="border-b bg-red-50">
                                        <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-2">{log.userEmail}</td>
                                        <td className="p-2 text-red-700 font-medium">Blocked: Replay Attack</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>

                <Card title="Recent Login Activity">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Timestamp</th>
                                <th className="p-2">User</th>
                                <th className="p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.loginAttempts.map(log => (
                                <tr key={log.id} className="border-b">
                                    <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-2">{log.userEmail}</td>
                                    <td className="p-2 text-green-600">Success</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </Layout>
    );
}
