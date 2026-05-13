import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';
import { encrypt } from '../../../lib/encryption';

export default withIronSessionApiRoute(async function handler(req, res) {
    const { user } = req.session;

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // ============================================================
    // REPLAY ATTACK PROTECTION — Nonce Validation
    // ============================================================
    const { item, amount, role, targetEmail, nonce } = req.body;

    // 1. Nonce WAJIB ada dalam setiap request
    if (!nonce) {
        await logEvent(user.email, 'REPLAY_ATTACK', {
            reason: 'Missing nonce in transaction request',
            endpoint: '/api/transaction/create',
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        });
        return res.status(400).json({ error: 'Missing request nonce. Possible replay attack detected.' });
    }

    // 2. Cari nonce dalam database
    const nonceRecord = await prisma.requestNonce.findUnique({ where: { nonce } });

    // 3. Reject jika nonce tak wujud (forged request)
    if (!nonceRecord) {
        await logEvent(user.email, 'REPLAY_ATTACK', {
            reason: 'Invalid or forged nonce',
            nonce,
            endpoint: '/api/transaction/create',
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        });
        return res.status(403).json({ error: 'Invalid nonce. Request rejected.' });
    }

    // 4. Reject jika nonce sudah tamat tempoh
    if (new Date() > new Date(nonceRecord.expiresAt)) {
        await prisma.requestNonce.delete({ where: { nonce } });
        await logEvent(user.email, 'REPLAY_ATTACK', {
            reason: 'Expired nonce reused (replay attack)',
            nonce,
            endpoint: '/api/transaction/create',
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        });
        return res.status(403).json({ error: 'Nonce expired. Possible replay attack detected.' });
    }

    // 5. Reject jika nonce bukan milik user ini
    if (nonceRecord.userId !== user.id) {
        await logEvent(user.email, 'REPLAY_ATTACK', {
            reason: 'Nonce belongs to different user (session hijack attempt)',
            nonce,
            endpoint: '/api/transaction/create',
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        });
        return res.status(403).json({ error: 'Nonce mismatch. Request rejected.' });
    }

    // 6. ✅ Nonce sah — PADAM SERTA-MERTA supaya tak boleh digunakan semula
    await prisma.requestNonce.delete({ where: { nonce } });
    // ============================================================

    // Validation & Basic Sanitization (Cybersecurity: Prevent XSS)
    const sanitizedItem = item ? item.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

    if (!sanitizedItem || !amount || !role || !targetEmail) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['buyer', 'seller'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    if (targetEmail === user.email) {
        return res.status(400).json({ error: 'You cannot transact with yourself' });
    }

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat < 1) {
        return res.status(400).json({ error: 'Amount must be at least RM 1' });
    }

    if (amountFloat > 30000) {
        return res.status(400).json({ error: 'Maximum transaction amount is RM 30,000' });
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
                item: encrypt(sanitizedItem),
                amount: amountFloat,
                fee,
                role,
                creatorEmail: user.email,
                targetEmail,
                status: 'pending',
                creatorId: user.id,
            },
        });

        // Log Event
        await logEvent(user.email, 'CREATE_TRANSACTION', { transactionId: transaction.id, amount: amountFloat });

        res.json(transaction);
    } catch (error) {
        console.error('Transaction Create Error:', error);
        res.status(500).json({ error: 'Failed to create transaction. Please check your inputs and try again.' });
    }
}, sessionOptions);
