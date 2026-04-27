import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import useUser from '../../lib/useUser';
import { useRouter } from 'next/router';

export default function CreateTransaction() {
    const { user } = useUser({ redirectTo: '/login' });
    const router = useRouter();

    const [role, setRole] = useState('buyer');
    const [item, setItem] = useState('');
    const [amount, setAmount] = useState('');
    const [targetEmail, setTargetEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fee Calculation Logic
    const feeValue = amount ? (parseFloat(amount) * 0.025) : 0;
    const totalValue = amount ? (parseFloat(amount) + feeValue) : 0;

    const feeDisplay = amount ? `RM ${feeValue.toFixed(2)}` : '';
    const totalDisplay = amount ? `RM ${totalValue.toFixed(2)}` : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (user && targetEmail === user.email) {
            setError("Please enter the other person's email, not your own.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/transaction/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role,
                    item,
                    amount,
                    targetEmail
                }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/transaction/created?id=${data.id}&link=${encodeURIComponent(`${window.location.origin}/transaction/${data.id}`)}&target=${targetEmail}&role=${role}`);
            } else {
                throw new Error(data.error || 'Failed to create transaction');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Create Transaction">
            <div className="bg-[#f8fafc] min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="max-w-4xl w-full">
                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4 text-indigo-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create a New Transaction</h2>
                        <p className="mt-2 text-sm text-gray-500">Set up your secure escrow transaction in seconds.</p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 overflow-hidden">
                        <div className="p-8 sm:p-10">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl mb-8 flex items-start space-x-3">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Role Selection - Tab Style */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Your Role</label>
                                    <div className="grid grid-cols-2 gap-4 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setRole('buyer')}
                                            className={`py-3 rounded-xl text-sm font-bold transition-all ${role === 'buyer' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            🛍️ I am the Buyer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole('seller')}
                                            className={`py-3 rounded-xl text-sm font-bold transition-all ${role === 'seller' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            💰 I am the Seller
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        <div>
                                            <label htmlFor="item" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">What are you trading?</label>
                                            <select
                                                name="item"
                                                id="item"
                                                required
                                                value={item}
                                                onChange={(e) => setItem(e.target.value)}
                                                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none bg-white transition-all text-gray-800"
                                            >
                                                <option value="">-- Select Category --</option>
                                                <option value="Event Ticket">🎟️ Event Ticket</option>
                                                <option value="Smartphone">📱 Smartphone</option>
                                                <option value="Laptop">💻 Laptop</option>
                                                <option value="Shoes">👟 Shoes</option>
                                                <option value="Furniture">🪑 Furniture</option>
                                                <option value="Website Domain">🌐 Website Domain</option>
                                                <option value="Social Media Account">📱 Social Media Account</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="amount" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Amount (MYR)</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-indigo-600 transition-colors">RM</span>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    id="amount"
                                                    step="0.01"
                                                    min="1"
                                                    required
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-bold text-gray-800"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Summary Box */}
                                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-indigo-600 font-medium italic">Base Amount</span>
                                                <span className="text-gray-700 font-bold">{amount ? `RM ${parseFloat(amount).toFixed(2)}` : 'RM 0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-indigo-600 font-medium italic">Platform Fee (2.5%)</span>
                                                <span className="text-gray-700 font-bold">{feeDisplay || 'RM 0.00'}</span>
                                            </div>
                                            <div className="pt-4 border-t border-indigo-200 flex justify-between items-end">
                                                <div>
                                                    <span className="block text-xs font-bold text-indigo-400 uppercase">Total to Pay</span>
                                                    <span className="text-2xl font-black text-indigo-700 leading-none">{totalDisplay || 'RM 0.00'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Target Email */}
                                <div>
                                    <label htmlFor="target_contact_email" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                        {role === 'buyer' ? "Seller's Contact Email" : "Buyer's Contact Email"}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            name="target_contact_email"
                                            id="target_contact_email"
                                            required
                                            value={targetEmail}
                                            onChange={(e) => setTargetEmail(e.target.value)}
                                            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all text-gray-800"
                                            placeholder="e.g. person@example.com"
                                        />
                                        <div className="mt-2 flex items-center text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            We will send an invitation to this email address.
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition duration-150 shadow-lg shadow-indigo-200/50 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                                >
                                    {loading ? 'Creating...' : (
                                        <>
                                            Create Secure Transaction
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
