import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions, isAdmin } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { verifyIntegrity, acknowledgeAndResetChain } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;

    if (!user || !isAdmin(user.email)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'POST') {
        // Verify Integrity
        try {
            const result = await verifyIntegrity();
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Verification failed' });
        }
    } else if (req.method === 'PUT') {
        // Acknowledge & Reset Chain
        try {
            await acknowledgeAndResetChain(user.email);
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Reset failed' });
        }
    } else {
        // Get Logs
        try {
            const logs = await prisma.auditLog.findMany({
                orderBy: { timestamp: 'desc' },
                take: 100, // Limit to last 100 for performance
            });
            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
}, sessionOptions);
