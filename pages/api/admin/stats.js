import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions, isAdmin } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;

    if (!user || !isAdmin(user.email)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const totalTransactions = await prisma.transaction.count();
        const totalUsers = await prisma.user.count();
        const recentLogs = await prisma.auditLog.findMany({
            take: 5,
            orderBy: { timestamp: 'desc' },
        });

        res.json({
            totalTransactions,
            totalUsers,
            recentLogs,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}, sessionOptions);
