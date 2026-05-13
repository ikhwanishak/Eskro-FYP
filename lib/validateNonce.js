import prisma from './prisma';
import { logEvent } from './security';

/**
 * Validates a single-use nonce for replay attack protection.
 * Returns { valid: true } or { valid: false, status, message }
 */
export async function validateNonce(nonce, userId, endpoint, userEmail, req) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

    if (!nonce) {
        await logEvent(userEmail, 'REPLAY_ATTACK', {
            reason: 'Missing nonce in request',
            endpoint,
            ip,
        });
        return { valid: false, status: 400, message: 'Missing request nonce. Possible replay attack detected.' };
    }

    const nonceRecord = await prisma.requestNonce.findUnique({ where: { nonce } });

    if (!nonceRecord) {
        await logEvent(userEmail, 'REPLAY_ATTACK', {
            reason: 'Invalid or forged nonce',
            nonce,
            endpoint,
            ip,
        });
        return { valid: false, status: 403, message: 'Invalid nonce. Request rejected.' };
    }

    if (new Date() > new Date(nonceRecord.expiresAt)) {
        await prisma.requestNonce.delete({ where: { nonce } });
        await logEvent(userEmail, 'REPLAY_ATTACK', {
            reason: 'Expired nonce reused (replay attack)',
            nonce,
            endpoint,
            ip,
        });
        return { valid: false, status: 403, message: 'Nonce expired. Possible replay attack detected.' };
    }

    if (nonceRecord.userId !== userId) {
        await logEvent(userEmail, 'REPLAY_ATTACK', {
            reason: 'Nonce belongs to a different user',
            nonce,
            endpoint,
            ip,
        });
        return { valid: false, status: 403, message: 'Nonce mismatch. Request rejected.' };
    }

    // ✅ Valid — consume nonce immediately
    await prisma.requestNonce.delete({ where: { nonce } });
    return { valid: true };
}
