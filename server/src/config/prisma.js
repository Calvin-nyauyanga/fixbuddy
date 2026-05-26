import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Check your .env file.'
  );
}

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;