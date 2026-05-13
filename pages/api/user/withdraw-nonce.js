import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import crypto from 'crypto';

export default withIronSessionApiRoute(async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { user } = req.session;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.requestNonce.create({
        data: {
            nonce,
            userId: user.id,
            endpoint: '/api/user/withdraw',
            expiresAt,
        },
    });

    return res.json({ nonce });
}, sessionOptions);
