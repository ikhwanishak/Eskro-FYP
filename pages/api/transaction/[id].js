import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;
    const { id } = req.query;

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: String(id) },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Access Control: Only Creator or Target can view
        if (transaction.creatorEmail !== user.email && transaction.targetEmail !== user.email) {
            // Log unauthorized access attempt?
            await logEvent(user.email, 'UNAUTHORIZED_ACCESS', { transactionId: id });
            return res.status(403).json({ error: 'Access denied' });
        }

        // Log View Event (HMAC)
        // Only log if it's a significant view? Requirement says "viewing transaction details" must be logged.
        // To avoid spamming logs on every refresh, maybe we can skip if recently logged?
        // But for strict compliance, let's log it.
        await logEvent(user.email, 'VIEW_TRANSACTION', { transactionId: id });

        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
}, sessionOptions);
