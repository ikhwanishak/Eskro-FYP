import prisma from './prisma';
import crypto from 'crypto';

const HMAC_SECRET = process.env.HMAC_SECRET;
if (!HMAC_SECRET) {
    throw new Error('CRITICAL SECURITY ERROR: HMAC_SECRET environment variable is not defined.');
}

// --- Tamper-Evident Logging (HMAC Hash Chain) ---

export async function logEvent(userEmail, event, data = {}) {
    const lastLog = await prisma.auditLog.findFirst({
        orderBy: { timestamp: 'desc' },
    });

    const previousHash = lastLog ? lastLog.hash : 'GENESIS_HASH';
    const timestamp = new Date();
    const timestampStr = timestamp.toISOString();

    // Data is logged but not part of the integrity hash to simplify verification
    // (since we don't store raw JSON data in the DB model for now)
    const payload = `${previousHash}${timestampStr}${event}${userEmail}`;

    const hash = crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(payload)
        .digest('hex');

    await prisma.auditLog.create({
        data: {
            userEmail,
            event,
            previousHash,
            hash,
            timestamp,
        },
    });
}

export async function verifyIntegrity() {
    const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'asc' },
    });

    let previousHash = 'GENESIS_HASH';
    let isTampered = false;
    let tamperedLogId = null;

    for (const log of logs) {
        const timestampStr = log.timestamp.toISOString();
        const payload = `${previousHash}${timestampStr}${log.event}${log.userEmail}`;

        const calculatedHash = crypto
            .createHmac('sha256', HMAC_SECRET)
            .update(payload)
            .digest('hex');

        let currentLinkBroken = false;
        if (calculatedHash !== log.hash || log.previousHash !== previousHash) {
            currentLinkBroken = true;
            if (!isTampered) {
                isTampered = true;
                tamperedLogId = log.id;
            }
        }

        // If it's a valid reset event, clear the tamper flag
        if (log.event === 'CHAIN_RESET' && !currentLinkBroken) {
            isTampered = false;
            tamperedLogId = null;
        }

        previousHash = log.hash;
    }

    return { status: isTampered ? 'TAMPERED' : 'OK', tamperedLogId };
}

export async function acknowledgeAndResetChain(adminEmail) {
    await logEvent(adminEmail, 'CHAIN_RESET');
}


// --- Replay Attack Protection ---

export async function generateChallenge() {
    const challenge = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    await prisma.authChallenge.create({
        data: {
            challenge,
            expiresAt
        }
    });

    return challenge;
}

export async function verifyChallenge(challenge) {
    const storedChallenge = await prisma.authChallenge.findUnique({
        where: { challenge }
    });

    if (!storedChallenge) {
        return { valid: false, reason: 'Challenge not found' };
    }

    if (storedChallenge.used) {
        return { valid: false, reason: 'Challenge already used (Replay Attack)' };
    }

    if (new Date() > storedChallenge.expiresAt) {
        return { valid: false, reason: 'Challenge expired' };
    }

    // Mark as used
    await prisma.authChallenge.update({
        where: { id: storedChallenge.id },
        data: { used: true }
    });

    return { valid: true };
}
