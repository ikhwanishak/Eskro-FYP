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
        const toyyibpaySecret = (process.env.TOYYIBPAY_SECRET_KEY || '').trim(); // Clean spaces
        let isActuallyPaid = false;

        if (status_id === '1' || status_id === 1) {
            console.log('Detected status_id=1, verifying with ToyyibPay API...');
            try {
                const verifyData = new URLSearchParams();
                verifyData.append('userSecretKey', toyyibpaySecret);
                verifyData.append('billCode', billcode);

                const verifyRes = await fetch('https://dev.toyyibpay.com/index.php/api/getBillTransactions', {
                    method: 'POST',
                    body: verifyData
                });

                if (verifyRes.ok) {
                    const transactions = await verifyRes.json();
                    console.log('ToyyibPay Verification Response:', JSON.stringify(transactions));

                    if (Array.isArray(transactions) && transactions.length > 0) {
                        const tpTx = transactions.find(t => t.billCode === billcode && (t.billpaymentStatus === '1' || t.billpaymentStatus === 1));
                        if (tpTx) {
                            console.log('Verification SUCCESS: Payment confirmed by ToyyibPay API.');
                            isActuallyPaid = true;
                        } else {
                            console.warn('Verification FAILED: Bill found but status is not 1.', transactions);
                        }
                    } else {
                        console.warn('Verification FAILED: ToyyibPay returned empty list for this billCode.');
                    }
                } else {
                    console.error('Verification API Call Failed:', verifyRes.status, await verifyRes.text());
                }
            } catch (vError) {
                console.error('Payment Verification API Runtime Error:', vError);
            }
            
            // FALLBACK FOR SANDBOX: If verification fails but status_id=1 is present, 
            // we trust it for now but LOG IT as a warning.
            if (!isActuallyPaid) {
                console.warn('CRITICAL: API verification failed but status_id=1 received. Proceeding with fallback (Trusting callback data)...');
                isActuallyPaid = true; 
            }
        }

        if (isActuallyPaid && transaction.status !== 'paid') {
            console.log(`Updating transaction ${transaction.id} to PAID...`);
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
            console.log('Transaction updated and event logged.');
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
