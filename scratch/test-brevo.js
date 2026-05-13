async function testBrevo() {
    const apiKey = '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';
    
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { email: 'ikhwanishak2001@gmail.com', name: 'EscrowSecure' },
                to: [{ email: 'ikhwanishak2001@gmail.com', name: 'Ikhwan' }],
                subject: 'Brevo Test Email',
                htmlContent: '<p>If you receive this, the Brevo API is working!</p>'
            })
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testBrevo();
