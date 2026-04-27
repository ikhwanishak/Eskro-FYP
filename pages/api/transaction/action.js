import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { user } = req.session;
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { transactionId, action } = req.body;
    if (!transactionId || !action) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: String(transactionId) }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const isCreator = user.email === transaction.creatorEmail;
        const isBuyer = (transaction.role === 'buyer' && isCreator) || (transaction.role === 'seller' && !isCreator);
        const isParticipant = user.email === transaction.creatorEmail || user.email === transaction.targetEmail;

        if (!isParticipant && !user.isAdmin) {
            await logEvent(user.email, 'UNAUTHORIZED_ACTION_ATTEMPT', { transactionId, action });
            return res.status(403).json({ error: 'Access denied' });
        }

        if (action === 'release') {
            if (transaction.status !== 'paid') {
                return res.status(400).json({ error: 'Cannot release funds for a non-paid transaction' });
            }
            if (!isBuyer) {
                return res.status(403).json({ error: 'Only the buyer can confirm receipt and release funds' });
            }

            const sellerEmail = transaction.role === 'seller' ? transaction.creatorEmail : transaction.targetEmail;

            // Use Prisma transaction to atomically update both transaction status and user balance
            const [updatedTx, updatedUser] = await prisma.$transaction([
                prisma.transaction.update({
                    where: { id: transactionId },
                    data: { status: 'completed' }
                }),
                prisma.user.update({
                    where: { email: sellerEmail },
                    data: { balance: { increment: transaction.amount } }
                })
            ]);

            await logEvent(user.email, 'FUNDS_RELEASED', { transactionId, amount: updatedTx.amount, sellerEmail });
            return res.json(updatedTx);
        }

        if (action === 'dispute') {
            if (transaction.status !== 'paid') {
                return res.status(400).json({ error: 'Only paid transactions can be disputed' });
            }
            if (!isBuyer) {
                return res.status(403).json({ error: 'Only the buyer can raise a dispute' });
            }

            const updated = await prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'disputed' }
            });

            await logEvent(user.email, 'TRANSACTION_DISPUTED', { transactionId });
            return res.json(updated);
        }

        if (action === 'cancel') {
            if (transaction.status !== 'pending') {
                return res.status(400).json({ error: 'Only pending transactions can be canceled by users. If paid, contact support for a refund.' });
            }

            const updated = await prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'canceled' }
            });

            await logEvent(user.email, 'TRANSACTION_CANCELED', { transactionId });
            return res.json(updated);
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error processing action' });
    }
}, sessionOptions);
