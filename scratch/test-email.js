const nodemailer = require('nodemailer');
// require('dotenv').config();

async function testEmail() {
    console.log('Testing email with user:', process.env.EMAIL_USER);
    const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/ /g, '') : '';
    console.log('Password length:', pass.length);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: pass,
        },
    });

    try {
        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: `"EscrowSecure Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email',
            text: 'If you receive this, email configuration is working.',
        });
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

testEmail();
