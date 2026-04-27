import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useUser from '../../lib/useUser';

export default function AdminAuditLogs() {
    const { user } = useUser({ redirectTo: '/login' });
    const [logs, setLogs] = useState([]);
    const [verifyStatus, setVerifyStatus] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        if (user?.isAdmin) {
            fetch('/api/admin/audit-logs')
                .then(res => res.json())
                .then(setLogs);
        }
    }, [user]);

    const handleVerify = async () => {
        setVerifying(true);
        setVerifyStatus(null);
        try {
            const res = await fetch('/api/admin/audit-logs', { method: 'POST' });
            const data = await res.json();
            setVerifyStatus(data);
        } catch (err) {
            console.error(err);
            setVerifyStatus({ status: 'ERROR' });
        } finally {
            setVerifying(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Are you sure you want to acknowledge this tamper and start a new chain?')) return;
        setResetting(true);
        try {
            await fetch('/api/admin/audit-logs', { method: 'PUT' });
            // Re-fetch logs
            const resLogs = await fetch('/api/admin/audit-logs');
            const dataLogs = await resLogs.json();
            setLogs(dataLogs);
            // Re-verify
            await handleVerify();
        } catch (err) {
            console.error(err);
        } finally {
            setResetting(false);
        }
    };

    if (!user?.isAdmin) return null;

    return (
        <Layout title="Audit Logs">
            <div className="w-full max-w-5xl flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Tamper-Evident Audit Logs</h1>
                    <Button onClick={handleVerify} isLoading={verifying} variant={verifyStatus?.status === 'TAMPERED' ? 'danger' : 'primary'}>
                        Verify Integrity (HMAC)
                    </Button>
                </div>

                {verifyStatus && (
                    <div className={`p-4 rounded-md mb-6 text-center flex flex-col items-center justify-center gap-4 ${verifyStatus.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        <div>
                            <div className="font-bold text-lg">Integrity Status: {verifyStatus.status}</div>
                            {verifyStatus.tamperedLogId && <div className="text-sm mt-1">Tampered Log ID: {verifyStatus.tamperedLogId}</div>}
                        </div>
                        {verifyStatus.status === 'TAMPERED' && (
                            <Button onClick={handleReset} isLoading={resetting} style={{ backgroundColor: '#f97316', color: 'white', border: 'none' }}>
                                Acknowledge Tamper & Reset Chain
                            </Button>
                        )}
                    </div>
                )}

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2">Timestamp</th>
                                    <th className="p-2">Event</th>
                                    <th className="p-2">User</th>
                                    <th className="p-2">Hash (HMAC)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-2 font-medium">{log.event}</td>
                                        <td className="p-2 text-sm">{log.userEmail}</td>
                                        <td className="p-2 text-xs font-mono text-gray-500 truncate max-w-xs" title={log.hash}>
                                            {log.hash.substring(0, 20)}...
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
