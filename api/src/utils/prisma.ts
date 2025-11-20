import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});
