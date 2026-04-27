import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent, verifyChallenge } from '../../../lib/security';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;
    const { transactionId, challenge } = req.body;

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!transactionId || !challenge) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    // 1. Replay Protection Check
    const challengeCheck = await verifyChallenge(challenge);
    if (!challengeCheck.valid) {
        await logEvent(user.email, 'REPLAY_ATTACK', { reason: challengeCheck.reason, challenge, transactionId });
        return res.status(400).json({ error: `Security Alert: ${challengeCheck.reason}` });
    }

    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.status !== 'pending') {
            return res.status(400).json({ error: 'Transaction is not pending' });
        }

        // 2. Role Check: Only the BUYER can pay
        // We need to determine if current user is the buyer.
        // Transaction has `role` which is the CREATOR's role.

        let isBuyer = false;
        if (transaction.role === 'buyer') {
            // Creator is buyer
            if (user.email === transaction.creatorEmail) isBuyer = true;
        } else {
            // Creator is seller, so Target is buyer
            if (user.email === transaction.targetEmail) isBuyer = true;
        }

        if (!isBuyer) {
            return res.status(403).json({ error: 'Only the buyer can make payment' });
        }

        // 3. Process Payment: Create ToyyibPay Bill
        const toyyibpaySecret = process.env.TOYYIBPAY_SECRET_KEY;
        const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
        
        if (!toyyibpaySecret || !categoryCode) {
            return res.status(500).json({ error: 'Payment gateway is not configured properly.' });
        }

        const totalAmount = transaction.amount + transaction.fee;
        const totalAmountCents = Math.round(totalAmount * 100);

        // Required parameters for ToyyibPay Sandbox
        const billData = new URLSearchParams();
        billData.append('userSecretKey', toyyibpaySecret);
        billData.append('categoryCode', categoryCode);
        billData.append('billName', `Escrow Transaction #${transactionId.slice(0, 8)}`);
        billData.append('billDescription', transaction.item);
        billData.append('billPriceSetting', '1');
        billData.append('billPayorInfo', '1');
        billData.append('billAmount', totalAmountCents.toString());
        billData.append('billReturnUrl', `${process.env.NEXT_PUBLIC_BASE_URL}/api/transaction/callback`);
        billData.append('billCallbackUrl', `${process.env.NEXT_PUBLIC_BASE_URL}/api/transaction/callback`);
        billData.append('billExternalReferenceNo', transactionId);
        billData.append('billTo', user.email);
        billData.append('billEmail', user.email);
        billData.append('billPhone', '0123456789'); // Dummy phone for sandbox

        const toyyibpayRes = await fetch('https://dev.toyyibpay.com/index.php/api/createBill', {
            method: 'POST',
            body: billData
        });

        if (!toyyibpayRes.ok) {
            const errorText = await toyyibpayRes.text();
            console.error('ToyyibPay Error:', errorText);
            return res.status(500).json({ error: 'Failed to create payment bill' });
        }

        const toyyibpayData = await toyyibpayRes.json();
        const billCode = toyyibpayData[0]?.BillCode;

        if (!billCode) {
            return res.status(500).json({ error: 'Invalid response from payment gateway' });
        }

        // 4. Update transaction with paymentRef, status remains pending
        await prisma.transaction.update({
            where: { id: transactionId },
            data: { paymentRef: billCode },
        });

        // 5. Log Event (HMAC)
        await logEvent(user.email, 'PAYMENT_INITIATED', { transactionId, amount: transaction.amount, billCode });

        res.json({ paymentUrl: `https://dev.toyyibpay.com/${billCode}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Payment failed' });
    }
}, sessionOptions);
