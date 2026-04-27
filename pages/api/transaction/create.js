import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { item, amount, role, targetEmail } = req.body;

    // Validation
    if (!item || !amount || !role || !targetEmail) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (targetEmail === user.email) {
        return res.status(400).json({ error: 'You cannot transact with yourself' });
    }

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat < 1) {
        return res.status(400).json({ error: 'Amount must be at least RM 1' });
    }

    // Calculate Fee (2.5%)
    const fee = amountFloat * 0.025;

    // Verify user exists in DB (in case of stale session after deletion)
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
        req.session.destroy();
        return res.status(401).json({ error: 'User record missing. Please logout and login again.' });
    }

    try {
        const transaction = await prisma.transaction.create({
            data: {
                item,
                amount: amountFloat,
                fee,
                role, // Role of the creator (buyer or seller)
                creatorEmail: user.email,
                targetEmail,
                status: 'pending',
                creatorId: user.id
                // meta field removed as it is not in schema
            },
        });

        // Log Event
        await logEvent(user.email, 'CREATE_TRANSACTION', { transactionId: transaction.id, amount: amountFloat });

        res.json(transaction);
    } catch (error) {
        console.error('Transaction Create Error:', error);

        // Write to log file for debugging
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(process.cwd(), 'public', 'transaction_error.log');
        fs.writeFileSync(logPath, `Error: ${error.message}\nStack: ${error.stack}\n`);

        res.status(500).json({ error: `Failed to create transaction: ${error.message}` });
    }
}, sessionOptions);
