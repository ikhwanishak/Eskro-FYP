/**
 * Migration script: Encrypt existing plaintext data in the database.
 * Run ONCE with: node scripts/encrypt-existing-data.js
 * 
 * This script safely encrypts:
 * - Transaction.item
 * - Withdrawal.accountNumber
 * - Withdrawal.bankName
 * 
 * It uses safeDecrypt to detect if data is already encrypted (skips it).
 */

const fs = require('fs');
const path = require('path');

// Manually load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
    }
});
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string.');
    }
    return Buffer.from(keyHex, 'hex');
}

function isAlreadyEncrypted(text) {
    if (!text) return false;
    const parts = text.split(':');
    // Format: iv(24 hex chars) : tag(32 hex chars) : data(hex)
    return parts.length === 3 && parts[0].length === 24 && parts[1].length === 32;
}

function encrypt(text) {
    if (!text) return null;
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

async function main() {
    const prisma = new PrismaClient();

    try {
        console.log('=== Starting database field encryption migration ===\n');

        // --- Encrypt Transaction.item ---
        const transactions = await prisma.transaction.findMany();
        console.log(`Found ${transactions.length} transactions to process...`);

        let txEncrypted = 0;
        let txSkipped = 0;

        for (const tx of transactions) {
            if (isAlreadyEncrypted(tx.item)) {
                txSkipped++;
                continue;
            }
            await prisma.transaction.update({
                where: { id: tx.id },
                data: { item: encrypt(tx.item) }
            });
            txEncrypted++;
            console.log(`  ✓ Encrypted transaction item [${tx.id.slice(0, 8)}...]: "${tx.item.slice(0, 30)}"`);
        }

        console.log(`\nTransactions: ${txEncrypted} encrypted, ${txSkipped} already encrypted (skipped).`);

        // --- Encrypt Withdrawal.accountNumber & Withdrawal.bankName ---
        const withdrawals = await prisma.withdrawal.findMany();
        console.log(`\nFound ${withdrawals.length} withdrawals to process...`);

        let wEncrypted = 0;
        let wSkipped = 0;

        for (const w of withdrawals) {
            const accAlreadyEncrypted = isAlreadyEncrypted(w.accountNumber);
            const bankAlreadyEncrypted = isAlreadyEncrypted(w.bankName);

            if (accAlreadyEncrypted && bankAlreadyEncrypted) {
                wSkipped++;
                continue;
            }

            await prisma.withdrawal.update({
                where: { id: w.id },
                data: {
                    accountNumber: accAlreadyEncrypted ? w.accountNumber : encrypt(w.accountNumber),
                    bankName: bankAlreadyEncrypted ? w.bankName : encrypt(w.bankName),
                }
            });
            wEncrypted++;
            console.log(`  ✓ Encrypted withdrawal [${w.id.slice(0, 8)}...]: accountNumber & bankName`);
        }

        console.log(`\nWithdrawals: ${wEncrypted} encrypted, ${wSkipped} already encrypted (skipped).`);
        console.log('\n=== Migration complete! ===');

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
