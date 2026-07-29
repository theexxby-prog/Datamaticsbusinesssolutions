/**
 * Client branding for the demo sandbox.
 *
 * The Channel Company logo asset was not available when this demo was built,
 * so every surface falls back to the "RL" initials avatar / wordmark text.
 *
 * To switch the whole app over once the asset arrives:
 *   1. Drop the file at `public/logos/tcc-logo.png` (or .svg).
 *   2. Set TCC_LOGO_PATH below to '/logos/tcc-logo.png'.
 *   3. Set the `logo` field on user u1 in context/AuthContext.tsx to the same path.
 *
 * Nothing else needs to change — the digest header and any logo-aware surface
 * read this constant and pick the wordmark fallback when it is null.
 */
export const TCC_LOGO_PATH: string | null = null;

/** Client wordmark used wherever the logo would otherwise render. */
export const TCC_WORDMARK = 'The Channel Company';

/** Max rendered logo height, matching the previous client logo styling. */
export const CLIENT_LOGO_MAX_HEIGHT_PX = 32;
