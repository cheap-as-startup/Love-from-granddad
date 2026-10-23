// This file runs on the server. The app calls /api/report when someone taps "Report".
import { ensureTables, sql } from '@/server/db';
import { checkReportLimits, senderId } from '@/server/spam';

// A walk is hidden automatically once this many different people report it.
const ReportsToHide = 3;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const walkId = Number(body?.walkId);
  if (!Number.isInteger(walkId) || walkId <= 0) {
    return Response.json({ error: 'Sorry, something went wrong.' }, { status: 400 });
  }

  await ensureTables();

  const sender = senderId(request);
  const limitProblem = await checkReportLimits(sender);
  if (limitProblem) {
    return Response.json({ error: limitProblem }, { status: 429 });
  }

  // Ignored if this person has already reported this walk, or the walk doesn't exist.
  await sql`
    INSERT INTO reports (walk_id, sender_id)
    SELECT ${walkId}, ${sender}
    WHERE EXISTS (SELECT 1 FROM walks WHERE id = ${walkId})
    ON CONFLICT DO NOTHING
  `;

  await sql`
    UPDATE walks SET hidden = true
    WHERE id = ${walkId}
      AND (SELECT COUNT(*) FROM reports WHERE walk_id = ${walkId}) >= ${ReportsToHide}
  `;

  return Response.json({ ok: true });
}
