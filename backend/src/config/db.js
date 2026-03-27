const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required and must point to Neon PostgreSQL.');
}

if (process.env.DATABASE_URL.includes('<user>') || process.env.DATABASE_URL.includes('<neon-host>')) {
  throw new Error('DATABASE_URL contains placeholders. Replace it with a real Neon connection string.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function checkDatabaseConnection() {
  await prisma.$connect();
  await prisma.$queryRawUnsafe('SELECT 1');
}

module.exports = {
  prisma,
  checkDatabaseConnection,
};
