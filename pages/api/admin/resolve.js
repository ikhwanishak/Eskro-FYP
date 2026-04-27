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

    const { transactionId, action } = req.body;
    if (!transactionId || !action) {
        return res.status(400).json({ error: 'Missing transactionId or action' });
    }

    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: String(transactionId) }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.status !== 'disputed') {
            return res.status(400).json({ error: 'Only disputed transactions can be resolved by admin' });
        }

        // Determine buyer and seller emails based on creator's role
        const buyerEmail = transaction.role === 'buyer' ? transaction.creatorEmail : transaction.targetEmail;
        const sellerEmail = transaction.role === 'seller' ? transaction.creatorEmail : transaction.targetEmail;

        if (action === 'refund') {
            // Refund to buyer: credit buyer's wallet balance
            const [updatedTx] = await prisma.$transaction([
                prisma.transaction.update({
                    where: { id: transactionId },
                    data: { status: 'refunded' }
                }),
                prisma.user.update({
                    where: { email: buyerEmail },
                    data: { balance: { increment: transaction.amount } }
                })
            ]);

            await logEvent(user.email, 'ADMIN_REFUND_ISSUED', {
                transactionId,
                amount: transaction.amount,
                buyerEmail
            });

            return res.json({ success: true, transaction: updatedTx });
        }

        if (action === 'force_release') {
            // Force release to seller: credit seller's wallet balance
            const [updatedTx] = await prisma.$transaction([
                prisma.transaction.update({
                    where: { id: transactionId },
                    data: { status: 'completed' }
                }),
                prisma.user.update({
                    where: { email: sellerEmail },
                    data: { balance: { increment: transaction.amount } }
                })
            ]);

            await logEvent(user.email, 'ADMIN_FORCE_RELEASE', {
                transactionId,
                amount: transaction.amount,
                sellerEmail
            });

            return res.json({ success: true, transaction: updatedTx });
        }

        return res.status(400).json({ error: 'Invalid action. Use "refund" or "force_release"' });

    } catch (error) {
        console.error('[Admin Resolve Error]', error);
        res.status(500).json({ error: 'Server error processing resolution' });
    }
}, sessionOptions);
