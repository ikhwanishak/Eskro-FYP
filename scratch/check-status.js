const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
    try {
        console.log('--- Recent Audit Logs ---');
        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 10
        });
        console.log(JSON.stringify(logs, null, 2));

        console.log('\n--- Recent Verification Tokens ---');
        const tokens = await prisma.verificationToken.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        console.log(JSON.stringify(tokens, null, 2));

        console.log('\n--- User Count ---');
        const userCount = await prisma.user.count();
        console.log('Total Users:', userCount);

    } catch (error) {
        console.error('Error checking status:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();
