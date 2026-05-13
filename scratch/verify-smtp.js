const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ikhwanishak2001@gmail.com',
        pass: 'zhpznlnxvwvuuuxw'
    }
});

transporter.verify(function(error, success) {
    if (error) {
        console.log('Error verifying:', error);
    } else {
        console.log('Server is ready to take our messages');
    }
});
