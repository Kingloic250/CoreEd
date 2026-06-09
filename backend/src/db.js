require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const url = new URL(rawUrl);
const pool = new pg.Pool({
  host: url.hostname,
  port: parseInt(url.port || '5432'),
  database: url.pathname.slice(1),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
