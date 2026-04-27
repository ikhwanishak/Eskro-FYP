import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions, isAdmin } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;

    if (!user || !isAdmin(user.email)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        // Replay Attacks (from Audit Logs)
        const replayAttacks = await prisma.auditLog.findMany({
            where: { event: 'REPLAY_ATTACK' },
            orderBy: { timestamp: 'desc' },
            take: 20,
        });

        // Login Attempts
        const loginAttempts = await prisma.auditLog.findMany({
            where: { event: 'LOGIN' },
            orderBy: { timestamp: 'desc' },
            take: 20,
        });

        const totalLogins = await prisma.auditLog.count({ where: { event: 'LOGIN' } });
        const totalReplays = await prisma.auditLog.count({ where: { event: 'REPLAY_ATTACK' } });

        res.json({
            replayAttacks,
            loginAttempts,
            totalLogins,
            totalReplays,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
}, sessionOptions);
