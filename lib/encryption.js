import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey() {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
    }
    return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param {string} text - Plaintext to encrypt.
 * @returns {string} - Encrypted string in format "iv:authTag:ciphertext" (hex).
 */
export function encrypt(text) {
    if (text === null || text === undefined) return null;
    const key = getKey();
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag(); // 128-bit authentication tag
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an encrypted string.
 * @param {string} encryptedText - Encrypted string from encrypt().
 * @returns {string|null} - Decrypted plaintext, or null if input is null.
 */
export function decrypt(encryptedText) {
    if (!encryptedText) return null;
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) return encryptedText; // Not encrypted, return as-is
        const [ivHex, tagHex, dataHex] = parts;
        const key = getKey();
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const data = Buffer.from(dataHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        return decipher.update(data).toString('utf8') + decipher.final('utf8');
    } catch {
        // If decryption fails (e.g. old plaintext data), return as-is
        return encryptedText;
    }
}

/**
 * Decrypts all sensitive fields of a Transaction object.
 * Safe to call on both encrypted and plaintext data.
 */
export function decryptTransaction(tx) {
    if (!tx) return null;
    return {
        ...tx,
        item: decrypt(tx.item),
    };
}

/**
 * Decrypts all sensitive fields of a Withdrawal object.
 * Safe to call on both encrypted and plaintext data.
 */
export function decryptWithdrawal(w) {
    if (!w) return null;
    return {
        ...w,
        accountNumber: decrypt(w.accountNumber),
        bankName: decrypt(w.bankName),
    };
}
