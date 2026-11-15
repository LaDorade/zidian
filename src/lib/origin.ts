import { ORIGIN } from '$app/env/public';

/** Public origin of the site, for absolute URLs. ORIGIN is always set in production (see src/env.ts). */
export const siteOrigin = (url: { origin: string }): string => ORIGIN ?? url.origin;
