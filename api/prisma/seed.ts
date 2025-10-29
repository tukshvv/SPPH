import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = '11111111-1111-1111-1111-111111111111';
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId
    }
  });
  console.log(`Seeded user with id ${userId}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
