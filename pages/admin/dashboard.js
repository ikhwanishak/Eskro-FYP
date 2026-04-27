import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Link from 'next/link';
import useUser from '../../lib/useUser';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
    const { user, loading: userLoading } = useUser({ redirectTo: '/login' });
    const router = useRouter();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (user && !user.isAdmin) {
            router.push('/dashboard');
        }
        if (user && user.isAdmin) {
            fetch('/api/admin/stats')
                .then(res => res.json())
                .then(setStats);
        }
    }, [user, router]);

    if (userLoading || !stats) return <Layout><div className="text-center mt-10">Loading Admin...</div></Layout>;

    return (
        <Layout title="Admin Dashboard">
            <div className="w-full max-w-5xl flex flex-col pb-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">System overview and activity monitoring.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Transactions</h2>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-6">{stats.totalTransactions}</div>
                        <Link href="/admin/transactions" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                            Manage Transactions <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </Link>
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Registered Users</h2>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-6">{stats.totalUsers}</div>
                        <Link href="/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                            Manage Users <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </Link>
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Security Alerts</h2>
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-red-600 mb-6">Monitor</div>
                        <Link href="/admin/security" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                            View Security Logs <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </Link>
                    </div>

                    {/* NEW: Withdrawals Card */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Withdrawals</h2>
                            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-yellow-600 mb-6">Requests</div>
                        <Link href="/admin/withdrawals" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                            Manage Withdrawals <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </Link>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50/50">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Audit Logs</h2>
                        <Link href="/admin/audit-logs" className="mt-3 sm:mt-0 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors shadow-sm text-center">
                            View All & Verify
                        </Link>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {stats.recentLogs.map(log => (
                            <li key={log.id} className="px-6 py-4 hover:bg-gray-50/80 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                <div className="flex items-center space-x-4">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${log.event === 'CHAIN_RESET' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                        {log.event}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">{log.userEmail}</span>
                                </div>
                                <span className="text-sm text-gray-500 mt-2 sm:mt-0">
                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
