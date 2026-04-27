const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing DB Connection...');
    try {
        const user = await prisma.user.create({
            data: {
                email: 'test_' + Date.now() + '@example.com',
                credentials: {
                    create: {
                        externalId: 'test_cred_' + Date.now(),
                        publicKey: Buffer.from('test_key'),
                        signCount: 0,
                        transports: '["internal"]'
                    }
                }
            }
        });
        console.log('User created successfully:', user);
    } catch (e) {
        console.error('Error creating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
