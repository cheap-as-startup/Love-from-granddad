// Server-only: the database connection and the tables we keep in it.
import { neon } from '@neondatabase/serverless';

// The database address and password come from an environment variable that
// Vercel sets for us, so they're never written into the code.
export const sql = neon(process.env.DATABASE_URL!);

// Creates or updates the tables the first time the server talks to the database.
let tablesReady: Promise<unknown> | null = null;

export function ensureTables() {
  tablesReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS walks (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        miles NUMERIC(5, 1) NOT NULL,
        message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    // Columns added for spam protection, photos and reporting.
    await sql`ALTER TABLE walks ADD COLUMN IF NOT EXISTS photo_url TEXT`;
    await sql`ALTER TABLE walks ADD COLUMN IF NOT EXISTS sender_id TEXT`;
    await sql`ALTER TABLE walks ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`;
    await sql`CREATE INDEX IF NOT EXISTS walks_sender_time ON walks (sender_id, created_at)`;

    // One row per person per reported walk, so nobody can report the same walk twice.
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        walk_id INTEGER NOT NULL REFERENCES walks (id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (walk_id, sender_id)
      )
    `;
  })().catch((error) => {
    // Try again next time rather than remembering the failure forever.
    tablesReady = null;
    throw error;
  });
  return tablesReady;
}
