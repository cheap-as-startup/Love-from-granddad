// This file runs on the server (Vercel), never on people's phones.
// The app talks to it at /api/walks: GET reads the walks, POST adds one.
import { checkWalk } from '@/lib/walk-rules';
import { ensureTables, sql } from '@/server/db';
import { moderateWalk } from '@/server/moderation';
import { cleanPhoto, PhotoError, storePhoto } from '@/server/photos';
import { checkWalkLimits, senderId } from '@/server/spam';

// The server's FormData can read fields back out; the phone app's version (which
// TypeScript assumes by default in this project) can only add them.
type ServerFormData = { get(name: string): string | File | null };

export async function GET() {
  await ensureTables();

  const [totals] = await sql`SELECT COALESCE(SUM(miles), 0)::float AS total_miles FROM walks WHERE hidden = false`;
  const walks = await sql`
    SELECT id, name, miles::float AS miles, message, photo_url AS "photoUrl", created_at AS "createdAt"
    FROM walks
    WHERE hidden = false
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return Response.json({ totalMiles: totals.total_miles, walks });
}

export async function POST(request: Request) {
  // The app sends walks as a form, so a photo can come along too.
  const form = (await request.formData().catch(() => null)) as ServerFormData | null;
  if (!form) {
    return error('Sorry, something went wrong. Please try again.');
  }

  const name = form.get('name');
  const miles = Number(form.get('miles'));
  const message = form.get('message');
  const photoFile = form.get('photo');

  const walk = {
    name: typeof name === 'string' ? name.trim() : '',
    miles: Math.round(miles * 10) / 10,
    message: typeof message === 'string' ? message.trim() || undefined : undefined,
  };

  // 1. The same rules the app checks: names, miles, links, swear words.
  const problem = checkWalk(walk);
  if (problem) {
    return error(problem);
  }

  await ensureTables();

  // 2. Spam limits for this sender.
  const sender = senderId(request);
  const limitProblem = await checkWalkLimits(sender, walk);
  if (limitProblem) {
    return error(limitProblem, 429);
  }

  // 3. Clean up the photo, if there is one.
  let photo: Buffer | undefined;
  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      photo = await cleanPhoto(photoFile);
    } catch (e) {
      if (e instanceof PhotoError) {
        return error(e.message);
      }
      throw e;
    }
  }

  // 4. Ask Claude whether the name, message and photo are family friendly.
  let verdict;
  try {
    verdict = await moderateWalk({ ...walk, photo });
  } catch (e) {
    console.error('Moderation failed', e);
    return error("Sorry, we couldn't check your post just now. Please try again in a minute.", 503);
  }
  if (!verdict.allowed) {
    return error(verdict.reason);
  }

  // 5. Only now, once everything has passed, store the photo and the walk.
  const photoUrl = photo ? await storePhoto(photo) : null;
  await sql`
    INSERT INTO walks (name, miles, message, photo_url, sender_id)
    VALUES (${walk.name}, ${walk.miles}, ${walk.message ?? null}, ${photoUrl}, ${sender})
  `;

  return Response.json({ ok: true }, { status: 201 });
}

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
