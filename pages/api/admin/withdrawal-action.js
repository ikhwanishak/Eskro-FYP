import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions, isAdmin } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { user } = req.session;
    if (!user || !isAdmin(user.email)) {
        return res.status(403).json({ error: 'Forbidden: Admin only' });
    }

    const { withdrawalId, action } = req.body;
    if (!withdrawalId || !action) {
        return res.status(400).json({ error: 'Missing withdrawalId or action' });
    }

    try {
        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id: String(withdrawalId) },
            include: { user: true }
        });

        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal not found' });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ error: `Withdrawal is already ${withdrawal.status}` });
        }

        if (action === 'approve') {
            const updated = await prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: { status: 'approved' }
            });

            await logEvent(user.email, 'WITHDRAWAL_APPROVED', {
                withdrawalId,
                amount: withdrawal.amount,
                userEmail: withdrawal.user.email
            });

            return res.json({ success: true, withdrawal: updated });
        }

        if (action === 'reject') {
            // Refund the balance back to user if rejected
            const [updated] = await prisma.$transaction([
                prisma.withdrawal.update({
                    where: { id: withdrawalId },
                    data: { status: 'rejected' }
                }),
                prisma.user.update({
                    where: { id: withdrawal.userId },
                    data: { balance: { increment: withdrawal.amount } }
                })
            ]);

            await logEvent(user.email, 'WITHDRAWAL_REJECTED', {
                withdrawalId,
                amount: withdrawal.amount,
                userEmail: withdrawal.user.email
            });

            return res.json({ success: true, withdrawal: updated });
        }

        return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });

    } catch (error) {
        console.error('[Withdrawal Action Error]', error);
        res.status(500).json({ error: 'Server error processing withdrawal action' });
    }
}, sessionOptions);
