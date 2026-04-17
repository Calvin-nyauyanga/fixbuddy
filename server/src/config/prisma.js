import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:Abcd1234567890p@localhost:5432/fixbuddy_db?sslmode=disable";
}

const prisma = new PrismaClient();

export default prisma;