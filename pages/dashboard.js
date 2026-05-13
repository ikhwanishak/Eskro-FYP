import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useUser from '../lib/useUser';

export default function Dashboard() {
    const { user, loading: userLoading } = useUser({ redirectTo: '/login' });
    const router = useRouter();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState({ balance: 0, withdrawals: [] });
    const [stats, setStats] = useState({
        total: 0, escrowValue: 0, completedValue: 0, pendingCount: 0, completedCount: 0
    });

    // Withdraw Modal State
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', accountNumber: '' });
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawError, setWithdrawError] = useState('');
    const [withdrawSuccess, setWithdrawSuccess] = useState('');

    const fetchWallet = useCallback(() => {
        fetch('/api/user/wallet')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data) setWalletData(data); })
            .catch(err => console.error('Wallet fetch error:', err));
    }, []);

    // Fetch transactions
    useEffect(() => {
        if (user) {
            fetch('/api/transaction/list')
                .then((res) => {
                    if (!res.ok) {
                        if (res.status === 401) router.push('/login');
                        throw new Error('API Error');
                    }
                    return res.json();
                })
                .then((data) => {
                    setTransactions(Array.isArray(data) ? data : []);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setTransactions([]);
                    setLoading(false);
                });

            fetchWallet();
        }
    }, [user, fetchWallet]);

    // Stats calculation
    useEffect(() => {
        if (!transactions.length && !loading) {
            setStats({ total: 0, escrowValue: 0, completedValue: 0, pendingCount: 0, completedCount: 0 });
            return;
        }
        const pendingTxs = transactions.filter(tx => ['paid', 'pending_release', 'funded', 'pending_fund', 'disputed'].includes(tx.status));
        const completedTxs = transactions.filter(tx => ['completed', 'released'].includes(tx.status));
        setStats({
            total: transactions.length,
            escrowValue: pendingTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0),
            completedValue: completedTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0),
            pendingCount: pendingTxs.length,
            completedCount: completedTxs.length
        });
    }, [transactions, loading]);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' })
            .format(amount).replace('MYR', 'RM');

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': case 'released':
                return { bg: 'bg-green-100 text-green-800', text: 'Completed', icon: '✓', iconColor: 'text-green-500' };
            case 'paid': case 'pending_release':
                return { bg: 'bg-yellow-100 text-yellow-800', text: 'Pending Release', icon: '⚠', iconColor: 'text-yellow-500' };
            case 'disputed':
                return { bg: 'bg-red-100 text-red-800', text: 'Disputed', icon: '⚡', iconColor: 'text-red-500' };
            case 'refunded':
                return { bg: 'bg-purple-100 text-purple-800', text: 'Refunded', icon: '↩', iconColor: 'text-purple-500' };
            case 'canceled':
                return { bg: 'bg-red-100 text-red-800', text: 'Canceled', icon: '✘', iconColor: 'text-red-500 opacity-70' };
            case 'funded':
                return { bg: 'bg-blue-100 text-blue-800', text: 'Funded', icon: 'ⓘ', iconColor: 'text-blue-500' };
            default:
                return { bg: 'bg-gray-100 text-gray-800', text: 'Waiting', icon: '…', iconColor: 'text-gray-500' };
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
        setWithdrawLoading(true);
        setWithdrawError('');
        setWithdrawSuccess('');
        try {
            // Step 1: Get single-use nonce (Replay Attack Protection)
            const nonceRes = await fetch('/api/user/withdraw-nonce', { method: 'POST' });
            if (!nonceRes.ok) throw new Error('Failed to get security token. Please try again.');
            const { nonce } = await nonceRes.json();

            // Step 2: Submit withdrawal with nonce
            const res = await fetch('/api/user/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(withdrawForm.amount),
                    bankName: withdrawForm.bankName,
                    accountNumber: withdrawForm.accountNumber,
                    nonce,
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Withdrawal failed');
            setWithdrawSuccess('✅ Withdrawal request submitted! Admin will process it shortly.');
            setWithdrawForm({ amount: '', bankName: '', accountNumber: '' });
            fetchWallet(); // Refresh balance
        } catch (err) {
            setWithdrawError(err.message);
        } finally {
            setWithdrawLoading(false);
        }
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
            </Head>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                        <button
                            onClick={() => { setShowWithdrawModal(false); setWithdrawError(''); setWithdrawSuccess(''); }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold bg-transparent border-none cursor-pointer"
                        >
                            ×
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">💳 Request Withdrawal</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Available balance: <strong className="text-green-600">{formatCurrency(walletData.balance)}</strong>
                        </p>

                        {withdrawSuccess ? (
                            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm font-medium text-center">
                                {withdrawSuccess}
                            </div>
                        ) : (
                            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Amount (RM)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        max={walletData.balance}
                                        value={withdrawForm.amount}
                                        onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))}
                                        placeholder="e.g. 100.00"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={withdrawForm.bankName}
                                        onChange={e => setWithdrawForm(f => ({ ...f, bankName: e.target.value }))}
                                        placeholder="e.g. Maybank"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        value={withdrawForm.accountNumber}
                                        onChange={e => setWithdrawForm(f => ({ ...f, accountNumber: e.target.value }))}
                                        placeholder="e.g. 1234567890"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                {withdrawError && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">{withdrawError}</div>
                                )}
                                <button
                                    type="submit"
                                    disabled={withdrawLoading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {withdrawLoading ? 'Submitting...' : 'Submit Withdrawal Request'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold text-gray-800 no-underline flex-shrink-0">
                        <span>EscrowSecure</span>
                    </Link>
                    <nav className="flex items-center gap-3 sm:gap-6">
                        <Link href="/dashboard" className="text-xs sm:text-sm font-bold text-blue-600 no-underline">Dashboard</Link>
                        <Link href="/transaction/create" className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-blue-600 no-underline">
                            <span className="hidden sm:inline">New Transaction</span>
                            <span className="sm:hidden">New</span>
                        </Link>
                        {user?.isAdmin && (
                            <Link href="/admin/dashboard" className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-800 no-underline">
                                <span className="hidden sm:inline">Admin Panel</span>
                                <span className="sm:hidden">Admin</span>
                            </Link>
                        )}
                        <span className="text-gray-400 text-xs font-medium hidden lg:block truncate max-w-[150px]">{user?.email}</span>
                        <button 
                            onClick={handleLogout} 
                            className="text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition bg-transparent cursor-pointer"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Account Overview */}
                    <h3 className="text-2xl font-bold text-gray-700 mb-6 mt-4 sm:mt-6">Account Overview</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {/* Wallet Card - GUARANTEED COLOR FIX */}
                        <div 
                            style={{ background: 'linear-gradient(135deg, #4338ca 0%, #1e40af 100%)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            className="rounded-2xl p-6 text-white relative overflow-hidden group shadow-lg"
                        >
                            <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-semibold text-blue-100">My Wallet</span>
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-extrabold mb-6 tracking-tight text-white">
                                    {formatCurrency(walletData.balance)}
                                </div>
                                <button 
                                    onClick={() => setShowWithdrawModal(true)}
                                    style={{ backgroundColor: '#ffffff', color: '#1e40af' }}
                                    className="w-full py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center gap-2 border-none cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Withdraw Funds
                                </button>
                            </div>
                        </div>

                        {/* Stat 2 — Total Transactions */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-3-8V6m0 4v8m6-8V6m0 4v8M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                            </div>
                            <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
                            <p className="text-xs text-green-500 mt-1">All time</p>
                        </div>

                        {/* Stat 3 — Value in Escrow */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Value in Escrow</p>
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8h.01M12 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-5" /></svg>
                            </div>
                            <p className="text-3xl font-extrabold text-gray-900 mt-1">{formatCurrency(stats.escrowValue)}</p>
                            <p className="text-xs text-yellow-600 mt-1">{stats.pendingCount} transactions pending</p>
                        </div>

                        {/* Stat 4 — Completed Value */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Completed Value</p>
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-3xl font-extrabold text-gray-900 mt-1">{formatCurrency(stats.completedValue)}</p>
                            <p className="text-xs text-gray-500 mt-1">{stats.completedCount} transactions settled</p>
                        </div>
                    </div>

                    {/* Transaction Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">My Transactions</h2>
                        <Link href="/transaction/create" className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition duration-150 shadow-md flex items-center justify-center space-x-2 no-underline text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            <span>New Transaction</span>
                        </Link>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="flex justify-center mt-16">
                            <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-2xl border border-gray-100 text-center">
                                <svg className="w-14 h-14 text-blue-600 mx-auto mb-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-9 0V3h4v2m-4 0h4m7 7l-3 3-3-3m3 3V9" /></svg>
                                <p className="text-xl font-bold text-gray-800 mb-2">You haven&#39;t created any transactions yet.</p>
                                <p className="text-gray-500 mb-6">Start your first secure exchange and see it appear here.</p>
                                <Link href="/transaction/create" className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition no-underline">
                                    Create your first transaction
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                            <ul className="divide-y divide-gray-100">
                                {transactions.slice(0, 10).map((tx) => {
                                    const style = getStatusStyles(tx.status);
                                    const isCreator = tx.creatorEmail === user.email;
                                    const myRole = isCreator ? tx.role : (tx.role === 'buyer' ? 'seller' : 'buyer');
                                    const otherParty = isCreator ? `To: ${tx.targetEmail}` : `From: ${tx.creatorEmail}`;
                                    const roleBadgeClass = myRole === 'buyer' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700';
                                    return (
                                        <Link key={tx.id} href={`/transaction/${tx.id}`} className="block no-underline group">
                                            <li className={`p-5 sm:p-6 hover:bg-blue-50/50 transition duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${tx.status === 'canceled' ? 'opacity-70' : ''}`}>
                                                <div className="flex items-start sm:items-center space-x-4">
                                                    <span className={`text-3xl sm:text-4xl ${style.iconColor} p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors`}>{style.icon}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{tx.item}</p>
                                                        <div className="flex flex-wrap items-center mt-1 gap-2">
                                                            <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[150px] sm:max-w-none">{otherParty}</p>
                                                            <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wide uppercase ${roleBadgeClass}`}>
                                                                {myRole === 'buyer' ? 'You: Buyer' : 'You: Seller'}
                                                            </span>
                                                            {tx.status === 'disputed' && (
                                                                <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wide uppercase bg-red-100 text-red-700">
                                                                    ⚡ DISPUTED
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-none pt-3 sm:pt-0">
                                                    <p className="text-lg font-black text-gray-900">{formatCurrency(parseFloat(tx.amount))}</p>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${style.bg}`}>
                                                        {style.text}
                                                    </span>
                                                </div>
                                            </li>
                                        </Link>
                                    );
                                })}
                            </ul>
                            {transactions.length > 10 && (
                                <div className="p-4 text-center border-t">
                                    <Link href="#" className="text-blue-600 font-medium hover:underline">
                                        View All {transactions.length} Transactions &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Withdrawal History */}
                    {walletData.withdrawals && walletData.withdrawals.length > 0 && (
                        <div className="mt-12">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">Withdrawal History</h3>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <ul className="divide-y divide-gray-100">
                                    {walletData.withdrawals.map(w => (
                                        <li key={w.id} className="flex items-center justify-between px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-800">{w.bankName} — {w.accountNumber}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{new Date(w.createdAt).toLocaleDateString('ms-MY')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{formatCurrency(w.amount)}</p>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                    w.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {w.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
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
