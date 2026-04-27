const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const emailsToDelete = [
        'ikhwanishak.work@gmail.com'
    ];

    console.log(`Deleting users: ${emailsToDelete.join(', ')}`);

    try {
        // 1. Get User IDs
        const users = await prisma.user.findMany({
            where: { email: { in: emailsToDelete } },
            select: { id: true }
        });
        const userIds = users.map(u => u.id);

        if (userIds.length === 0) {
            console.log("No users found to delete.");
            return;
        }

        // 2. Delete Related Data
        console.log("Deleting Credentials...");
        await prisma.credential.deleteMany({ where: { userId: { in: userIds } } });

        console.log("Deleting Transactions (Created)...");
        await prisma.transaction.deleteMany({ where: { creatorId: { in: userIds } } });

        console.log("Deleting Transactions (Target)...");
        await prisma.transaction.deleteMany({ where: { targetEmail: { in: emailsToDelete } } });

        console.log("Deleting AuditLogs...");
        await prisma.auditLog.deleteMany({ where: { userEmail: { in: emailsToDelete } } });

        // 3. Delete Users
        console.log("Deleting Users...");
        const result = await prisma.user.deleteMany({
            where: { id: { in: userIds } },
        });
        console.log(`Deleted ${result.count} users successfully.`);

    } catch (e) {
        console.error('Error deleting users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
