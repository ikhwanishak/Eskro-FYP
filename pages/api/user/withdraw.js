import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';
import { encrypt } from '../../../lib/encryption';
import { validateNonce } from '../../../lib/validateNonce';

export default withIronSessionApiRoute(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { user } = req.session;
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, bankName, accountNumber, nonce } = req.body;

    // Replay Attack Protection
    const nonceCheck = await validateNonce(nonce, user.id, '/api/user/withdraw', user.email, req);
    if (!nonceCheck.valid) {
        return res.status(nonceCheck.status).json({ error: nonceCheck.message });
    }

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
                    bankName: encrypt(bankName.trim()),
                    accountNumber: encrypt(accountNumber.trim()),
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
