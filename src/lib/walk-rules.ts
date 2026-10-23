// Shared by the app (instant feedback) and the server (which must never trust what it's sent).
// Loaded with require() on purpose: with a normal import, Expo's bundler picks this
// library's ESM wrapper, which it mishandles, and every check crashes.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const obscenity: typeof import('obscenity') = require('obscenity');
const { englishDataset, englishRecommendedTransformers, RegExpMatcher } = obscenity;

// Nobody walks more than this in one go — it catches typos like "50" instead of "5.0".
export const MaxMilesPerWalk = 100;
export const MinNameLength = 2;
export const MaxNameLength = 30;
export const MaxMessageLength = 200;

export type NewWalk = {
  name: string;
  miles: number;
  message?: string;
};

// Real places whose names happen to contain a rude word, so the filter mustn't block them.
const AllowedPlaceNames = ['penistone', 'penisarwaun', 'cockett', 'cockermouth', 'scunthorpe'];

// Catches swear words, including disguised ones like "sh1t".
const englishWords = englishDataset.build();
const swearFilter = new RegExpMatcher({
  ...englishWords,
  whitelistedTerms: [...(englishWords.whitelistedTerms ?? []), ...AllowedPlaceNames],
  ...englishRecommendedTransformers,
});

// Also catches words spelled out with gaps, like "f u c k" or "f.u.c.k".
function containsSwearing(text: string) {
  const squashed = text.replace(/\b\w(?:[\s._-]+\w\b){2,}/g, (letters) =>
    letters.replace(/[\s._-]+/g, ''),
  );
  return swearFilter.hasMatch(text) || swearFilter.hasMatch(squashed);
}

// Names may only use letters (including Welsh ones like ŵ and ŷ), spaces,
// hyphens, apostrophes and full stops — so no numbers, links or symbols.
const NamePattern = /^[\p{L}\p{M}][\p{L}\p{M} '’.-]*$/u;

// Links and email addresses — the classic way spammers advertise.
const LinkPattern = /(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|co|uk|io|ly|me|info|biz|xyz|app)\b|@\w+\.\w+)/i;

// Seven or more digits close together look like a phone number.
const PhonePattern = /(\d[\s-]?){7,}/;

// Returns a friendly error message, or null if the walk looks good.
export function checkWalk(walk: NewWalk): string | null {
  const name = walk.name.trim();
  const message = walk.message?.trim() ?? '';

  if (name === '') {
    return 'Please add your name so Granddad knows who walked with him.';
  }
  if (name.length < MinNameLength || name.length > MaxNameLength) {
    return `Please use a name between ${MinNameLength} and ${MaxNameLength} characters.`;
  }
  if (!NamePattern.test(name) || LinkPattern.test(name)) {
    return 'Names can only use letters, spaces, hyphens and apostrophes.';
  }
  if (containsSwearing(name)) {
    return 'Please choose a family-friendly name.';
  }

  if (!Number.isFinite(walk.miles) || walk.miles <= 0) {
    return 'Please enter how many miles you walked, for example 2.5';
  }
  if (walk.miles > MaxMilesPerWalk) {
    return `That's a long way! Please enter ${MaxMilesPerWalk} miles or fewer per walk.`;
  }

  if (message.length > MaxMessageLength) {
    return `Please keep your message to ${MaxMessageLength} characters or fewer.`;
  }
  if (LinkPattern.test(message)) {
    return "Please don't include links or email addresses in your message.";
  }
  if (PhonePattern.test(message)) {
    return "Please don't include phone numbers in your message.";
  }
  if (containsSwearing(message)) {
    return 'Please keep your message family friendly.';
  }

  return null;
}
