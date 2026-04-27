import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';

export default withIronSessionApiRoute(function handler(req, res) {
    if (req.session.user) {
        res.json({
            isLoggedIn: true,
            ...req.session.user,
        });
    } else {
        res.json({
            isLoggedIn: false,
            email: req.session.email, // Return verified email if present
            email_verified: req.session.email_verified,
        });
    }
}, sessionOptions);
