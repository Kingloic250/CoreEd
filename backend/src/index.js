require('dotenv').config();
const app = require('./app');
const { runMigrations } = require('./db');

const PORT = process.env.PORT || 3001;

async function start() {
  console.log('Running database migrations...');
  await runMigrations();
  console.log('Migrations complete.');

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
