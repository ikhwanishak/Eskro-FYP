const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const HMAC_SECRET = process.env.HMAC_SECRET || 'super-secret-key-change-me';

async function main() {
    const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'asc' },
    });

    let previousHash = 'GENESIS_HASH';

    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const timestampStr = log.timestamp.toISOString();
        const payload = `${previousHash}${timestampStr}${log.event}${log.userEmail}`;

        const calculatedHash = crypto
            .createHmac('sha256', HMAC_SECRET)
            .update(payload)
            .digest('hex');

        if (calculatedHash !== log.hash || log.previousHash !== previousHash) {
            console.log("--- TAMPER DETECTED ---");
            console.log("Log ID:", log.id);
            console.log("Log Event:", log.event);
            console.log("Log User:", log.userEmail);
            console.log("Log Timestamp:", timestampStr);
            console.log("");
            console.log("Expected Previous Hash:", previousHash);
            console.log("Actual Previous Hash stored:", log.previousHash);
            console.log("");
            console.log("Calculated Payload String:", payload);
            console.log("Expected Hash for this payload:", calculatedHash);
            console.log("Actual Hash stored in DB:", log.hash);
            
            if (i > 0) {
                console.log("\n--- PREVIOUS LOG ---");
                console.log("Prev Log ID:", logs[i-1].id);
                console.log("Prev Log Hash:", logs[i-1].hash);
            }
            break;
        }

        previousHash = log.hash;
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
