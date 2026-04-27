import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { body } = req;
    const { challenge, email } = req.session;

    if (!challenge || !email) {
        return res.status(400).json({ error: 'Session expired or invalid' });
    }

    let verification;
    try {
        const host = req.headers.host;
        const rpID = host.split(':')[0]; // Remove port if present
        const expectedOrigin = req.headers.origin || `http://${host}`;

        verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: challenge,
            expectedOrigin,
            expectedRPID: rpID,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
        let { credentialPublicKey, credentialID, counter } = registrationInfo;

        // Fallback for different SimpleWebAuthn versions/structures
        if (!credentialID && registrationInfo.credential) {
            credentialID = registrationInfo.credential.id;
            credentialPublicKey = registrationInfo.credential.publicKey;
        }

        try {
            // Handle credentialID (could be Buffer or Base64URL string)
            let externalId;
            if (typeof credentialID === 'string') {
                externalId = credentialID;
            } else {
                // Assuming Buffer or Uint8Array
                externalId = Buffer.from(credentialID).toString('base64url');
            }

            // Handle publicKey (could be Buffer, Uint8Array, or Object)
            let publicKeyBuffer;
            if (Buffer.isBuffer(credentialPublicKey) || credentialPublicKey instanceof Uint8Array) {
                publicKeyBuffer = Buffer.from(credentialPublicKey);
            } else {
                // If it's a plain object {0: val, 1: val}, convert to array first
                publicKeyBuffer = Buffer.from(Object.values(credentialPublicKey));
            }

            // Create User and Credential
            // Check if user exists (Recovery Flow)
            const existingUser = await prisma.user.findUnique({ where: { email } });
            let userId;

            if (existingUser) {
                // Add new credential to existing user
                await prisma.credential.create({
                    data: {
                        userId: existingUser.id,
                        externalId: externalId,
                        publicKey: publicKeyBuffer,
                        signCount: counter || 0,
                        transports: body.response.transports ? JSON.stringify(body.response.transports) : null,
                    },
                });
                userId = existingUser.id;

                // Log Event
                await logEvent(email, 'RECOVERY_NEW_DEVICE', { userId });
            } else {
                // Create New User and Credential
                const newUser = await prisma.user.create({
                    data: {
                        email,
                        credentials: {
                            create: {
                                externalId: externalId,
                                publicKey: publicKeyBuffer,
                                signCount: counter || 0,
                                transports: body.response.transports ? JSON.stringify(body.response.transports) : null,
                            },
                        },
                    },
                });
                userId = newUser.id;

                // Log Event
                await logEvent(email, 'REGISTRATION', { userId });
            }

            // Clear temporary session data
            req.session.challenge = undefined;

            // Log them in
            req.session.user = {
                id: userId,
                email: email,
                isAdmin: false,
            };
            await req.session.save();

            res.json({ verified: true });
        } catch (error) {
            console.error(error);
            // DEBUG LOGGING
            try {
                const fs = require('fs');
                const path = require('path');
                const errorLogPath = path.join(process.cwd(), 'public', 'error.log');
                fs.writeFileSync(errorLogPath, `VERIFY_REG_ERROR: ${error.message}\n${error.stack}`);
            } catch (logError) {
                console.error("Failed to write error log:", logError);
            }

            res.status(500).json({ error: 'Failed to create user' });
        }
    } else {
        res.status(400).json({ verified: false });
    }
}, sessionOptions);
