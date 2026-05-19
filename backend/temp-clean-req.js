require('dotenv').config();
const prisma = require('./src/db');
async function main() {
  await prisma.accountRequest.deleteMany({ where: { email: 'test@test.com' } });
  console.log('Cleaned test request');
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); prisma.$disconnect(); });
