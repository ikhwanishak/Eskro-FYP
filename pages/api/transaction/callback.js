import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ToyyibPay sends status_id, billcode, order_id, msg, transaction_id
    // in GET query parameters for Return URL, and POST body for Callback URL.
    const data = req.method === 'GET' ? req.query : req.body;
    
    // DEBUG: Log raw data to see what ToyyibPay is sending
    console.log('ToyyibPay Callback Raw Data:', JSON.stringify(data));

    // Handle both billcode and billCode (case-sensitivity fix)
    const billcode = data.billcode || data.billCode;
    const status_id = data.status_id || data.statusId;
    const transaction_id = data.transaction_id || data.transactionId;

    if (!billcode || !status_id) {
        console.error('Missing parameters from ToyyibPay:', data);
        return res.status(400).json({ error: 'Missing parameters', received: data });
    }

    try {
        const transaction = await prisma.transaction.findFirst({
            where: { paymentRef: billcode },
            include: { creator: true }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found for this bill' });
        }

        // SECURITY FIX: Verify payment status directly with ToyyibPay API
        // Do not trust the status_id from the request alone!
        const toyyibpaySecret = process.env.TOYYIBPAY_SECRET_KEY;
        let isActuallyPaid = false;

        if (status_id === '1') {
            try {
                const verifyData = new URLSearchParams();
                verifyData.append('userSecretKey', toyyibpaySecret); // MISSING THIS BEFORE
                verifyData.append('billCode', billcode);
                // verifyData.append('billpaymentStatus', '1'); // Some sandbox versions don't like this filter

                const verifyRes = await fetch('https://dev.toyyibpay.com/index.php/api/getBillTransactions', {
                    method: 'POST',
                    body: verifyData
                });

                if (verifyRes.ok) {
                    const transactions = await verifyRes.json();
                    console.log('ToyyibPay Verification Response:', JSON.stringify(transactions));

                    // If ToyyibPay returns a list containing this billCode and it's successful
                    if (Array.isArray(transactions) && transactions.length > 0) {
                        // Check if any transaction for this billCode has status '1' (Success)
                        const tpTx = transactions.find(t => t.billCode === billcode && (t.billpaymentStatus === '1' || t.billpaymentStatus === 1));
                        if (tpTx) {
                            isActuallyPaid = true;
                        }
                    }
                }
            } catch (vError) {
                console.error('Payment Verification API Error:', vError);
            }
        }

        if (isActuallyPaid && transaction.status !== 'paid') {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'paid' },
            });

            const userEmail = transaction.role === 'buyer' ? transaction.creatorEmail : transaction.targetEmail;
            await logEvent(userEmail, 'PAYMENT_SUCCESS', { 
                transactionId: transaction.id, 
                amount: transaction.amount, 
                billCode: billcode,
                toyyibpayTxId: transaction_id
            });
        }

        // If it's a GET request (Return URL), redirect the user back to the transaction page
        if (req.method === 'GET') {
            return res.redirect(`/transaction/${transaction.id}`);
        }

        // If it's a POST request (Callback URL), just acknowledge receipt
        res.status(200).send('OK');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({ error: 'Internal server error during callback' });
    }
}
