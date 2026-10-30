export const RESERVED_ORGANIZER_SLUGS = new Set([
  'platform',
  'dashboard',
  'login',
  'signup',
  'admin',
  'api',
  'o',
  'receipt',
  'webhook',
  'register',
  'become-organizer',
  'help',
  'terms',
  'privacy',
]);

export function isValidOrganizerSlug(slug) {
  return /^[a-z0-9-]{3,40}$/.test(slug) && !RESERVED_ORGANIZER_SLUGS.has(slug);
}
