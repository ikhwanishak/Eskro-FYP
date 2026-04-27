import React, { useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useRouter } from 'next/router';
import useUser from '../../lib/useUser';

export default function TransactionCreated() {
    const { user } = useUser({ redirectTo: '/login' });
    const router = useRouter();
    const { link, target } = router.query;
    const [copied, setCopied] = useState(false);

    const copyLink = () => {
        if (link) {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Layout title="Transaction Created">
            <div className="max-w-2xl mx-auto mt-10">
                <Card title="Transaction Created">
                    <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
                        Transaction successfully created! Share the link below with the other party.
                    </div>

                    <div className="mb-6">
                        <label className="label">Transaction Link</label>
                        <div className="flex gap-2">
                            <input
                                className="input bg-gray-50 flex-grow"
                                value={link || ''}
                                readOnly
                            />
                            <Button onClick={copyLink} variant="outline">
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                        <p className="text-sm text-muted mt-2">
                            Send this link to <strong>{target}</strong>
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md mb-6">
                        <p className="text-sm text-blue-800 mb-1">
                            <strong>Your Role:</strong> {router.query.role ? router.query.role.charAt(0).toUpperCase() + router.query.role.slice(1) : ''}
                        </p>
                        <p className="text-sm text-blue-800">
                            <strong>Verified as:</strong> {user?.email}
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
