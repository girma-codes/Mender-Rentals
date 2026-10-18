import fs from 'fs';
import path from 'path';
import { pool } from './connection';

async function migrate(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('Running migration…');
  await pool.query(sql);
  console.log('Migration complete.');
  await pool.end();
  process.exit(0);
}

migrate().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
