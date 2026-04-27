import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        // 1. Find token
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        // 2. Check if expired
        if (new Date() > verificationToken.expires) {
            return res.status(400).json({ error: 'Token expired' });
        }

        // 3. Check if used
        if (verificationToken.used) {
            return res.status(400).json({ error: 'Token already used' });
        }

        // 4. Mark as used
        await prisma.verificationToken.update({
            where: { id: verificationToken.id },
            data: { used: true },
        });

        // 5. Set Session (Email Verified)
        // CRITICAL: Clear any existing user session to prevent "logged in as X" interfering with "registering as Y"
        req.session.user = null;
        req.session.email = verificationToken.identifier;
        req.session.email_verified = true;
        await req.session.save();

        // 6. Log Event
        await logEvent(verificationToken.identifier, 'EMAIL_VERIFIED', {});

        res.json({ success: true, email: verificationToken.identifier });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}, sessionOptions);
