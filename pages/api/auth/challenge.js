import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import { generateChallenge } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const challenge = await generateChallenge();
    res.json({ challenge });
}, sessionOptions);
