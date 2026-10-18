import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Neon (and most hosted PostgreSQL providers) require SSL.
// The connection string carries sslmode=require; we also set ssl: true
// so the pg driver negotiates TLS even when the query-param isn't parsed.
export const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  ssl: process.env['DATABASE_URL']?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<import('pg').QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
  return res;
}
