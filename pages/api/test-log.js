import { logEvent } from '../../lib/security';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    try {
        await logEvent('test@example.com', 'DEBUG_TEST', { foo: 'bar' });
        res.status(200).json({ success: true });
    } catch (error) {
        const errorLogPath = path.join(process.cwd(), 'public', 'error.log');
        fs.writeFileSync(errorLogPath, `${error.message}\n${error.stack}`);
        res.status(500).json({ error: error.message });
    }
}
