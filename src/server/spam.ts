// Server-only: limits that stop one person flooding the app.
import { createHash } from 'node:crypto';

import { sql } from '@/server/db';

export const Limits = {
  walksPerHour: 5,
  walksPerDay: 20,
  milesPerDay: 100,
  reportsPerHour: 10,
};

// We recognise repeat senders by their internet address, but only ever store a
// scrambled "fingerprint" of it — never the address itself — to protect privacy.
export function senderId(request: Request) {
  const address =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return createHash('sha256')
    .update(`${process.env.SENDER_ID_SECRET ?? 'love-from-granddad'}:${address}`)
    .digest('hex');
}

// Returns a friendly error message if this walk breaks a limit, or null if it's fine.
export async function checkWalkLimits(
  sender: string,
  walk: { name: string; miles: number; message?: string },
): Promise<string | null> {
  const [recent] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE created_at > now() - interval '1 hour')::int AS last_hour,
      COUNT(*)::int AS last_day,
      COALESCE(SUM(miles), 0)::float AS miles_today
    FROM walks
    WHERE sender_id = ${sender} AND created_at > now() - interval '1 day'
  `;

  if (recent.last_hour >= Limits.walksPerHour || recent.last_day >= Limits.walksPerDay) {
    return "You've logged a lot of walks recently — please wait a little while before adding more.";
  }
  if (recent.miles_today + walk.miles > Limits.milesPerDay) {
    return `That would take you over ${Limits.milesPerDay} miles today — please check your miles.`;
  }

  const [duplicate] = await sql`
    SELECT 1 FROM walks
    WHERE sender_id = ${sender}
      AND name = ${walk.name}
      AND miles = ${walk.miles}
      AND created_at > now() - interval '10 minutes'
    LIMIT 1
  `;
  if (duplicate) {
    return 'It looks like you just logged this walk already.';
  }

  return null;
}

export async function checkReportLimits(sender: string): Promise<string | null> {
  const [recent] = await sql`
    SELECT COUNT(*)::int AS last_hour FROM reports
    WHERE sender_id = ${sender} AND created_at > now() - interval '1 hour'
  `;
  if (recent.last_hour >= Limits.reportsPerHour) {
    return "You've sent a lot of reports recently — please try again later.";
  }
  return null;
}
