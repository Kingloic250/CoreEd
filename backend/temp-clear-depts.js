require('dotenv').config();
const prisma = require('./src/db');
async function main() {
  const count = await prisma.department.count();
  if (count > 0) {
    await prisma.department.deleteMany();
    console.log('Cleared', count, 'departments');
  } else {
    console.log('No departments to clear');
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); prisma.$disconnect(); });
