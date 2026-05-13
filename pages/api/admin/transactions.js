import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions, isAdmin } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { decryptTransaction } from '../../../lib/encryption';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;

    if (!user || !isAdmin(user.email)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(transactions.map(decryptTransaction));
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
}, sessionOptions);
