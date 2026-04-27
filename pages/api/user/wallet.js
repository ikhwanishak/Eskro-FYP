import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default withIronSessionApiRoute(async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { user } = req.session;
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: {
                withdrawals: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!dbUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            balance: dbUser.balance,
            withdrawals: dbUser.withdrawals
        });

    } catch (error) {
        console.error('[Wallet API Error]', error);
        res.status(500).json({ error: 'Failed to fetch wallet data' });
    }
}, sessionOptions);
