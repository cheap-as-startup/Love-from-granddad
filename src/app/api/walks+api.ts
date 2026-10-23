// This file runs on the server (Vercel), never on people's phones.
// The app talks to it at /api/walks: GET reads the walks, POST adds one.
import { neon } from '@neondatabase/serverless';

import { checkWalk } from '@/lib/walk-rules';

// The database address and password come from an environment variable that
// Vercel sets for us, so they're never written into the code.
const sql = neon(process.env.DATABASE_URL!);

// Creates the walks table the first time the server talks to the database.
let tableReady: Promise<unknown> | null = null;
function ensureTable() {
  tableReady ??= sql`
    CREATE TABLE IF NOT EXISTS walks (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      miles NUMERIC(5, 1) NOT NULL,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `.catch((error) => {
    // Try again next time rather than remembering the failure forever.
    tableReady = null;
    throw error;
  });
  return tableReady;
}

export async function GET() {
  await ensureTable();

  const [totals] = await sql`SELECT COALESCE(SUM(miles), 0)::float AS total_miles FROM walks`;
  const walks = await sql`
    SELECT id, name, miles::float AS miles, message, created_at AS "createdAt"
    FROM walks
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return Response.json({ totalMiles: totals.total_miles, walks });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const walk = {
    name: typeof body?.name === 'string' ? body.name.trim() : '',
    miles: typeof body?.miles === 'number' ? Math.round(body.miles * 10) / 10 : NaN,
    message: typeof body?.message === 'string' ? body.message.trim() || undefined : undefined,
  };

  const error = checkWalk(walk);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  await ensureTable();
  await sql`
    INSERT INTO walks (name, miles, message)
    VALUES (${walk.name}, ${walk.miles}, ${walk.message ?? null})
  `;

  return Response.json({ ok: true }, { status: 201 });
}
