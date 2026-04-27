import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';

export default withIronSessionApiRoute(function handler(req, res) {
    req.session.destroy();
    res.json({ isLoggedIn: false });
}, sessionOptions);
