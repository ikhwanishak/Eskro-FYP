import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions, isAdmin } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;

    if (!user || !isAdmin(user.email)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: { credentials: true }, // To show if passkey registered
        });

        // Sanitize
        const sanitizedUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            createdAt: u.createdAt,
            passkeyRegistered: u.credentials.length > 0,
        }));

        res.json(sanitizedUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
}, sessionOptions);
