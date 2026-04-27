import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { generateChallenge } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: { credentials: true },
    });

    if (!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    try {
        // DEBUG: Log credentials
        const fs = require('fs');
        const path = require('path');
        const debugLogPath = path.join(process.cwd(), 'public', 'login_debug.log');
        fs.writeFileSync(debugLogPath, JSON.stringify(user.credentials, null, 2));

        // Dynamic RP ID for ngrok support
        const host = req.headers.host;
        const rpID = host.split(':')[0]; // Remove port if present

        // Generate options
        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: user.credentials.map((cred) => ({
                id: cred.externalId, // Pass as Base64URL string
                type: 'public-key',
                transports: cred.transports ? JSON.parse(cred.transports) : undefined,
            })),
            userVerification: 'preferred',
        });

        const dbChallenge = await generateChallenge(); // Returns string, stores in DB
        options.challenge = dbChallenge;

        // We also store the email in session to know who is trying to login
        req.session.email = email;
        await req.session.save();

        res.json(options);
    } catch (error) {
        console.error(error);
        const fs = require('fs');
        const path = require('path');
        const errorLogPath = path.join(process.cwd(), 'public', 'login_error.log');
        fs.writeFileSync(errorLogPath, `LOGIN_OPT_ERROR: ${error.message}\n${error.stack}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}, sessionOptions);
