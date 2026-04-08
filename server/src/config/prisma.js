import { PrismaClient } from '@prisma/client';

// Set DATABASE_URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:Abcd1234567890p@localhost:5432/fixbuddy_db?sslmode=disable";
}

// Prisma 7.x: PrismaClient uses DATABASE_URL environment variable
const prisma = new PrismaClient({
  adapter: "postgresql",
});

export default prisma;