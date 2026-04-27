import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions, isAdmin } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { verifyChallenge, logEvent } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { body } = req;
    const { email } = req.session;

    if (!email) {
        return res.status(400).json({ error: 'Session expired' });
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: { credentials: true },
    });

    if (!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    const credential = user.credentials.find(
        (cred) => cred.externalId === body.id
    );

    if (!credential) {
        return res.status(400).json({ error: 'Credential not found' });
    }

    // REPLAY PROTECTION: Verify challenge from DB
    const challenge = body.response.clientDataJSON
        ? JSON.parse(Buffer.from(body.response.clientDataJSON, 'base64').toString('utf-8')).challenge
        : null;

    const challengeCheck = await verifyChallenge(challenge);
    if (!challengeCheck.valid) {
        await logEvent(email, 'REPLAY_ATTACK', { reason: challengeCheck.reason, challenge });
        return res.status(400).json({ error: `Security Alert: ${challengeCheck.reason}` });
    }

    let verification;
    try {
        // Ensure publicKey is Uint8Array
        let publicKey = credential.publicKey;
        if (publicKey && publicKey.type === 'Buffer' && Array.isArray(publicKey.data)) {
            publicKey = Buffer.from(publicKey.data);
        } else if (!(publicKey instanceof Uint8Array) && !(Buffer.isBuffer(publicKey))) {
            publicKey = Buffer.from(Object.values(publicKey));
        }

        // Ensure credentialID is Uint8Array
        const credentialID = Buffer.from(credential.externalId, 'base64url');

        // SAFEGUARD: Check if buffers are empty
        if (!publicKey || publicKey.length === 0) throw new Error('Invalid Public Key');
        if (!credentialID || credentialID.length === 0) throw new Error('Invalid Credential ID');

        const deviceAuthenticator = {
            credentialPublicKey: new Uint8Array(publicKey),
            credentialID: new Uint8Array(credentialID),
            counter: Number(credential.signCount || 0), // Restore real counter for Clone Detection
            // Aliases for compatibility with different library versions/types
            publicKey: new Uint8Array(publicKey),
            id: new Uint8Array(credentialID),
        };

        const host = req.headers.host;
        const rpID = host.split(':')[0]; // Remove port if present
        const expectedOrigin = req.headers.origin || `http://${host}`;

        verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: challenge,
            expectedOrigin,
            expectedRPID: rpID,
            authenticator: deviceAuthenticator,
            credential: deviceAuthenticator, // Alias for safety
        });
    } catch (error) {
        console.error('LOGIN_VERIFY_ERROR:', error);
        return res.status(400).json({ error: 'Authentication failed. Please try again.' });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
        // Update counter
        await prisma.credential.update({
            where: { id: credential.id },
            data: { signCount: authenticationInfo.newCounter },
        });

        // Log Login Event (HMAC)
        await logEvent(email, 'LOGIN', { userAgent: req.headers['user-agent'] });

        // Set Session
        const userIsAdmin = isAdmin(email);
        req.session.user = {
            id: user.id,
            email: user.email,
            isAdmin: userIsAdmin,
        };
        await req.session.save();

        res.json({ verified: true, isAdmin: userIsAdmin });
    } else {
        res.status(400).json({ verified: false });
    }
}, sessionOptions);
