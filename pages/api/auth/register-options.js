import { generateRegistrationOptions } from '@simplewebauthn/server';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // SECURITY: Ensure email is verified
    if (!req.session.email_verified || req.session.email !== email) {
        return res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
    }

    // Check if user already exists
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        // If email is NOT verified, block registration
        // If email IS verified, we allow proceeding (this enables Account Recovery / Add Device)
        if (!req.session.email_verified || req.session.email !== email) {
            return res.status(400).json({ error: 'User already exists. Please login.' });
        }
    }

    const host = req.headers.host;
    const rpID = host.split(':')[0]; // Remove port if present

    const options = await generateRegistrationOptions({
        rpName: 'EscrowSecure',
        rpID,
        userName: email,
        attestationType: 'none',
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            authenticatorAttachment: 'platform',
        },
    });

    // Save challenge to session for verification
    req.session.challenge = options.challenge;
    req.session.email = email; // Store email temporarily
    await req.session.save();

    res.json(options);
}, sessionOptions);
