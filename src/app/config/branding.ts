/**
 * Client branding for the demo sandbox.
 *
 * The Channel Company wordmark is "THE **CHANNEL** CO." — light weight, heavy
 * weight, light weight — set between two horizontal red rules. TCC ship it in
 * two variants: white type on a black plate, and black type on white.
 *
 * No image asset reached this session, so <TccWordmark /> renders a typographic
 * stand-in in that layout. To switch every surface over to the real file:
 *   1. Drop it at `public/logos/tcc-logo.png` (or .svg).
 *   2. Set TCC_LOGO_PATH below to '/logos/tcc-logo.png'.
 *   3. Set the `logo` field on user u1 in context/AuthContext.tsx to the same path.
 *
 * Use the black-on-white variant: the client UI is light-mode only, so the
 * dark-plate version would need its own black box to sit correctly on the page.
 */
export const TCC_LOGO_PATH: string | null = null;

/** Client wordmark text, used wherever the logo would otherwise render. */
export const TCC_WORDMARK = 'The Channel Company';

/** Max rendered logo height, matching the previous client logo styling. */
export const CLIENT_LOGO_MAX_HEIGHT_PX = 32;

/**
 * The red in TCC's own wordmark rules. This is the client's brand colour, not
 * ours — deliberately kept separate from the Datamatics token (#BA2027) so the
 * two are never confused or "corrected" into each other.
 */
export const TCC_RULE_RED = '#E03A3A';
