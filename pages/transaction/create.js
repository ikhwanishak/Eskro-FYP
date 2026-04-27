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
            <div className="bg-blue-50 min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Create a New Transaction</h2>

                    {error && (
                        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-sm">
                            <ul className="list-disc list-inside">
                                <li>{error}</li>
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Role</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="buyer"
                                        required
                                        className="accent-blue-600 w-4 h-4"
                                        checked={role === 'buyer'}
                                        onChange={(e) => setRole(e.target.value)}
                                    />
                                    <span>Buyer</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="seller"
                                        required
                                        className="accent-blue-600 w-4 h-4"
                                        checked={role === 'seller'}
                                        onChange={(e) => setRole(e.target.value)}
                                    />
                                    <span>Seller</span>
                                </label>
                            </div>
                        </div>

                        {/* Item */}
                        <div>
                            <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                            <select
                                name="item"
                                id="item"
                                required
                                value={item}
                                onChange={(e) => setItem(e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg focus:ring focus:ring-blue-200 focus:outline-none bg-white"
                            >
                                <option value="">-- Select Item --</option>
                                <option value="Event Ticket">Event Ticket</option>
                                <option value="Smartphone">Smartphone</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Shoes">Shoes</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Website Domain">Website Domain</option>
                                <option value="Social Media Account">Social Media Account</option>
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (MYR)</label>
                            <input
                                type="number"
                                name="amount"
                                id="amount"
                                step="0.01"
                                min="1"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
                                placeholder="e.g. 250.00"
                            />
                        </div>

                        {/* Fee */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (2.5%)</label>
                            <input
                                type="text"
                                id="fee"
                                disabled
                                value={feeDisplay}
                                className="w-full px-4 py-3 border bg-gray-100 rounded-lg text-gray-600"
                            />
                        </div>

                        {/* Total with Fee */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total with Fee</label>
                            <input
                                type="text"
                                id="total"
                                disabled
                                value={totalDisplay}
                                className="w-full px-4 py-3 border bg-gray-100 rounded-lg text-gray-600 font-semibold"
                            />
                        </div>

                        {/* Email Pihak Kedua */}
                        <div>
                            <label id="emailLabel" htmlFor="target_contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                                {role === 'buyer' ? "Seller's Email (not your own)" : (role === 'seller' ? "Buyer's Email (not your own)" : "Email of the other person")}
                            </label>
                            <input
                                type="email"
                                name="target_contact_email"
                                id="target_contact_email"
                                required
                                value={targetEmail}
                                onChange={(e) => setTargetEmail(e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
                                placeholder="e.g. person@example.com"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Transaction'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
