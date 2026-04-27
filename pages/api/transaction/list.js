import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { creatorEmail: user.email },
                    { targetEmail: user.email },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
}, sessionOptions);
