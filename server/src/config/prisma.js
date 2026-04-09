import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const { PrismaClient } = pkg;

// Set DATABASE_URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:Abcd1234567890p@localhost:5432/fixbuddy_db?sslmode=disable";
}

// Create a connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// Create the Prisma Client with the adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;