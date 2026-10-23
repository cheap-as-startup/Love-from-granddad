// Shared by the app (instant feedback) and the server (which must never trust what it's sent).

// Nobody walks more than this in one go — it catches typos like "50" instead of "5.0".
export const MaxMilesPerWalk = 100;
export const MaxNameLength = 50;
export const MaxMessageLength = 200;

export type NewWalk = {
  name: string;
  miles: number;
  message?: string;
};

// Returns a friendly error message, or null if the walk looks good.
export function checkWalk(walk: NewWalk): string | null {
  if (walk.name.trim() === '') {
    return 'Please add your name so Granddad knows who walked with him.';
  }
  if (walk.name.length > MaxNameLength) {
    return `Please keep your name to ${MaxNameLength} characters or fewer.`;
  }
  if (!Number.isFinite(walk.miles) || walk.miles <= 0) {
    return 'Please enter how many miles you walked, for example 2.5';
  }
  if (walk.miles > MaxMilesPerWalk) {
    return `That's a long way! Please enter ${MaxMilesPerWalk} miles or fewer per walk.`;
  }
  if (walk.message && walk.message.length > MaxMessageLength) {
    return `Please keep your message to ${MaxMessageLength} characters or fewer.`;
  }
  return null;
}
