import nodemailer from 'nodemailer';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { logEvent } from '../../../lib/security';
import crypto from 'crypto';

export default withIronSessionApiRoute(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, next } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Rate Limiting: Check attempts in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const attempts = await prisma.verificationToken.count({
            where: {
                identifier: email,
                createdAt: { gt: oneHourAgo },
            },
        });

        if (attempts >= 5) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }

        // 2. Invalidate old tokens
        await prisma.verificationToken.updateMany({
            where: { identifier: email, used: false },
            data: { used: true },
        });

        // 3. Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // 4. Store token in DB
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
            },
        });

        // 5. Send Email via Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS.replace(/ /g, ''), // Remove spaces from app password
            },
        });

        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const baseUrl = `${protocol}://${host}`;
        let verificationLink = `${baseUrl}/verify?token=${token}`;
        if (next) {
            verificationLink += `&next=${encodeURIComponent(next)}`;
        }

        await transporter.sendMail({
            from: `"EscrowSecure" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify your email for EscrowSecure',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Verify your email</h2>
                    <p>Click the link below to verify your email address and continue setting up your passkey.</p>
                    <a href="${verificationLink}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
                    <p style="margin-top: 20px; color: #666; font-size: 12px;">This link will expire in 5 minutes.</p>
                    <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                </div>
            `,
        });

        // 6. Log Event
        await logEvent(email, 'MAGIC_LINK_SENT', { attempts: attempts + 1 });

        res.json({ success: true, message: 'Verification link sent' });

    } catch (error) {
        console.error('SEND_MAGIC_LINK_ERROR:', error);
        res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
    }
}, sessionOptions);
