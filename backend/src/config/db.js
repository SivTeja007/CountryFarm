const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const hasDatabaseUrl =
  !!process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('<user>') &&
  !process.env.DATABASE_URL.includes('<neon-host>');

const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : null;

const adapter = pool ? new PrismaPg(pool) : null;

const prisma = adapter ? new PrismaClient({ adapter }) : null;

async function checkDatabaseConnection() {
  if (!prisma) {
    throw new Error('DATABASE_URL is missing or invalid.');
  }

  await prisma.$connect();
  await prisma.$queryRawUnsafe('SELECT 1');
}

module.exports = {
  prisma,
  checkDatabaseConnection,
};
