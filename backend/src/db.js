const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        run_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const files = fs.readdirSync(path.join(__dirname, '../migrations')).sort();
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      const { rows } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
      if (rows.length === 0) {
        const sql = fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        console.log(`  ✓ Migration: ${file}`);
      }
    }
  } finally {
    client.release();
  }
}

module.exports = { pool, runMigrations };
