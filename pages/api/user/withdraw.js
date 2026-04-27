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

    const { amount, bankName, accountNumber } = req.body;

    if (!amount || !bankName || !accountNumber) {
        return res.status(400).json({ error: 'Amount, bank name, and account number are required' });
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    try {
        // Check current balance
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
        });

        if (!dbUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (dbUser.balance < withdrawAmount) {
            return res.status(400).json({
                error: `Insufficient balance. Current balance: RM ${dbUser.balance.toFixed(2)}`
            });
        }

        // Atomically deduct balance and create withdrawal record
        const [withdrawal] = await prisma.$transaction([
            prisma.withdrawal.create({
                data: {
                    amount: withdrawAmount,
                    bankName: bankName.trim(),
                    accountNumber: accountNumber.trim(),
                    userId: dbUser.id,
                    status: 'pending'
                }
            }),
            prisma.user.update({
                where: { email: user.email },
                data: { balance: { decrement: withdrawAmount } }
            })
        ]);

        await logEvent(user.email, 'WITHDRAWAL_REQUESTED', {
            withdrawalId: withdrawal.id,
            amount: withdrawAmount,
            bankName,
            accountNumber
        });

        res.json({ success: true, withdrawal });

    } catch (error) {
        console.error('[Withdraw API Error]', error);
        res.status(500).json({ error: 'Failed to process withdrawal request' });
    }
}, sessionOptions);
