import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useUser from '../lib/useUser';

export default function Dashboard() {
    const { user, loading: userLoading } = useUser({ redirectTo: '/login' });
    const router = useRouter();

    // State untuk menyimpan data transaksi
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        escrowValue: 0,
        completedValue: 0,
        pendingCount: 0,
        completedCount: 0
    });

    // Effect khusus untuk memuat Tailwind CSS (Fix untuk masalah layout "pecah")
    // Menggunakan method injection yang user minta
    useEffect(() => {
        if (!document.querySelector('script[src="https://cdn.tailwindcss.com"]')) {
            const script = document.createElement('script');
            script.src = "https://cdn.tailwindcss.com";
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    // Fetch Real Data (Gantikan Mock Data)
    useEffect(() => {
        if (user) {
            fetch('/api/transaction/list')
                .then((res) => res.json())
                .then((data) => {
                    setTransactions(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [user]);

    // Pengiraan Statistik
    useEffect(() => {
        if (!transactions.length && !loading) {
            setStats({
                total: 0,
                escrowValue: 0,
                completedValue: 0,
                pendingCount: 0,
                completedCount: 0
            });
            return;
        }

        const pendingTxs = transactions.filter(tx => ['paid', 'pending_release', 'funded', 'pending_fund'].includes(tx.status));
        const completedTxs = transactions.filter(tx => ['completed', 'released'].includes(tx.status));

        const valueInEscrow = pendingTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
        const completedValue = completedTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

        setStats({
            total: transactions.length,
            escrowValue: valueInEscrow,
            completedValue: completedValue,
            pendingCount: pendingTxs.length,
            completedCount: completedTxs.length
        });
    }, [transactions, loading]);

    // Fungsi Helper untuk Format Mata Wang (RM)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ms-MY', {
            style: 'currency',
            currency: 'MYR'
        }).format(amount).replace('MYR', 'RM');
    };

    // Fungsi Helper untuk menentukan warna status
    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed':
            case 'released':
                return {
                    bg: 'bg-green-100 text-green-800',
                    text: 'Completed',
                    icon: '✓',
                    iconColor: 'text-green-500'
                };
            case 'paid':
            case 'pending_release':
                return {
                    bg: 'bg-yellow-100 text-yellow-800',
                    text: 'Pending Release',
                    icon: '⚠',
                    iconColor: 'text-yellow-500'
                };
            case 'canceled':
                return {
                    bg: 'bg-red-100 text-red-800',
                    text: 'Canceled',
                    icon: '✘',
                    iconColor: 'text-red-500 opacity-70'
                };
            case 'funded':
                return {
                    bg: 'bg-blue-100 text-blue-800',
                    text: 'Funded',
                    icon: 'ⓘ',
                    iconColor: 'text-blue-500'
                };
            default:
                return {
                    bg: 'bg-gray-100 text-gray-800',
                    text: 'Waiting',
                    icon: '…',
                    iconColor: 'text-gray-500'
                };
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (userLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col antialiased bg-[#f7f9fb] font-sans text-gray-800">
            <Head>
                <title>Dashboard - EscrowSecure</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
                {/* Fallback if JS injection fails or runs late */}
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>

            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold text-gray-800 no-underline">
                        <span>EscrowSecure</span>
                    </Link>

                    <nav className="flex items-center space-x-6">
                        <Link href="/dashboard" className="font-semibold text-blue-600 no-underline">Dashboard</Link>
                        <Link href="/transaction/create" className="text-gray-600 hover:text-blue-600 transition duration-150 no-underline">New Transaction</Link>
                        {user?.isAdmin && (
                            <Link href="/admin/dashboard" className="text-red-600 hover:text-red-800 font-semibold transition duration-150 no-underline">Admin Panel</Link>
                        )}
                        <span className="text-gray-700 font-medium hidden sm:inline-block">{user?.email}</span>
                        <button onClick={handleLogout} className="text-blue-600 hover:text-blue-800 font-semibold transition duration-150 bg-transparent border-none cursor-pointer">
                            Logout
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Stats Summary */}
                    <h3 className="text-2xl font-bold text-gray-700 mb-6 mt-4 sm:mt-6">Account Overview</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {/* Stat 1 */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                                {/* SVG Icon */}
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-3-8V6m0 4v8m6-8V6m0 4v8M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"></path></svg>
                            </div>
                            <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
                            <p className="text-xs text-green-500 mt-1">All time</p>
                        </div>

                        {/* Stat 2 */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Value in Escrow</p>
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8h.01M12 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-5"></path></svg>
                            </div>
                            <p className="text-3xl font-extrabold text-gray-900 mt-1">{formatCurrency(stats.escrowValue)}</p>
                            <p className="text-xs text-yellow-600 mt-1">{stats.pendingCount} transactions pending</p>
                        </div>

                        {/* Stat 3 */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Completed Value</p>
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <p className="text-3xl font-extrabold text-gray-900 mt-1">{formatCurrency(stats.completedValue)}</p>
                            <p className="text-xs text-gray-500 mt-1">{stats.completedCount} transactions settled</p>
                        </div>
                    </div>

                    {/* Transaction Section */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-800">My Transactions</h2>
                        <Link href="/transaction/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition duration-150 shadow-md flex items-center space-x-1 no-underline">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            <span>New Transaction</span>
                        </Link>
                    </div>

                    {/* Conditional Rendering: Empty State OR List */}
                    {transactions.length === 0 ? (
                        // Empty State
                        <div className="flex justify-center mt-16">
                            <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl border border-gray-100 text-center">
                                <svg className="w-14 h-14 text-blue-600 mx-auto mb-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-9 0V3h4v2m-4 0h4m7 7l-3 3-3-3m3 3V9"></path></svg>
                                <p className="text-xl font-bold text-gray-800 mb-2">You haven't created any transactions yet.</p>
                                <p className="text-gray-500 mb-6">Start your first secure exchange and see it appear here.</p>
                                <Link href="/transaction/create" className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition no-underline">
                                    Create your first transaction
                                </Link>
                            </div>
                        </div>
                    ) : (
                        // Transaction List
                        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                            <ul className="divide-y divide-gray-100">
                                {transactions.slice(0, 5).map((tx) => {
                                    const style = getStatusStyles(tx.status);
                                    // Map API data to UI fields
                                    const itemName = tx.item;
                                    const partyName = tx.creatorEmail === user.email ? `To: ${tx.targetEmail}` : `From: ${tx.creatorEmail}`;

                                    return (
                                        <Link key={tx.id} href={`/transaction/${tx.id}`} className="block no-underline">
                                            <li className={`p-4 sm:p-6 hover:bg-blue-50 transition duration-150 cursor-pointer flex items-center justify-between space-x-4 ${tx.status === 'canceled' ? 'opacity-70' : ''}`}>
                                                <div className="flex items-center space-x-4">
                                                    <span className={`text-3xl ${style.iconColor}`}>{style.icon}</span>
                                                    <div>
                                                        <p className="text-lg font-semibold text-gray-800">{itemName}</p>
                                                        <p className="text-sm text-gray-500">{partyName}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(parseFloat(tx.amount))}</p>
                                                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${style.bg}`}>
                                                        {style.text}
                                                    </span>
                                                </div>
                                            </li>
                                        </Link>
                                    );
                                })}
                            </ul>

                            {/* Footer "View All" */}
                            {transactions.length > 5 && (
                                <div className="p-4 text-center border-t">
                                    <Link href="#" className="text-blue-600 font-medium hover:underline">
                                        View All {transactions.length} Transactions &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 text-center text-sm text-gray-500 bg-white border-t flex justify-between items-center px-4 sm:px-6 lg:px-8">
                <div className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-grow text-center">
                    &copy; {new Date().getFullYear()} EscrowSecure. All rights reserved. | <a href="#" className="text-blue-600 hover:underline">Need Help?</a>
                </div>
                <div className="w-8 h-8 opacity-0"></div>
            </footer>
        </div>
    );
}
