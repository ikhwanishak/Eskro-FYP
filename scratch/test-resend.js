const { Resend } = require('resend');

async function testResend() {
    const apiKey = 're_BiPsk7Vz_GG2ZTTDcbh9AdWpRP1D4Bwqa'; // Hardcoded for test
    const resend = new Resend(apiKey);

    try {
        console.log('Attempting to send test email via Resend...');
        const { data, error } = await resend.emails.send({
            from: 'EscrowSecure <onboarding@resend.dev>',
            to: 'ikhwanishak2001@gmail.com',
            subject: 'Resend Test',
            html: '<p>If you receive this, Resend is working correctly.</p>'
        });

        if (error) {
            console.error('Resend Error:', error);
        } else {
            console.log('Resend Success!', data);
        }
    } catch (err) {
        console.error('Catch Error:', err);
    }
}

testResend();
