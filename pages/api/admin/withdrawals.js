import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions, isAdmin } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;

    if (!user || !isAdmin(user.email)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const withdrawals = await prisma.withdrawal.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { email: true }
                }
            }
        });

        res.json(withdrawals);
    } catch (error) {
        console.error('[Admin Withdrawals Error]', error);
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
}, sessionOptions);
