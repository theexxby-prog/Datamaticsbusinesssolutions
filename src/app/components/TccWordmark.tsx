import { TCC_LOGO_PATH, TCC_WORDMARK, TCC_RULE_RED, CLIENT_LOGO_MAX_HEIGHT_PX } from '../config/branding';

interface TccWordmarkProps {
  /** 'light' sets black type for light backgrounds; 'dark' sets white type on a black plate. */
  variant?: 'light' | 'dark';
  className?: string;
}

/**
 * The Channel Company wordmark.
 *
 * When a real logo asset is configured in config/branding.ts this renders that
 * image and nothing else. Until then it renders a typographic stand-in in the
 * wordmark's own layout — "THE CHANNEL CO." between two red rules — which reads
 * as deliberate branding rather than a missing image.
 *
 * This is a stand-in, not a reproduction of the registered mark. Replace it with
 * the supplied asset before anything client-facing ships.
 */
export function TccWordmark({ variant = 'light', className = '' }: TccWordmarkProps) {
  if (TCC_LOGO_PATH) {
    return (
      <img
        src={TCC_LOGO_PATH}
        alt={TCC_WORDMARK}
        className={`w-auto object-contain ${className}`}
        style={{ maxHeight: `${CLIENT_LOGO_MAX_HEIGHT_PX}px` }}
      />
    );
  }

  const onDark = variant === 'dark';
  const type = onDark ? 'text-white' : 'text-gray-900';

  return (
    <div
      className={`inline-flex flex-col items-stretch gap-1 ${onDark ? 'bg-black px-4 py-2.5 rounded-md' : ''} ${className}`}
      role="img"
      aria-label={TCC_WORDMARK}
    >
      <span className="h-1 rounded-sm" style={{ background: TCC_RULE_RED }} />
      <span className={`inline-flex items-baseline justify-center leading-none ${type}`}>
        <span className="font-light tracking-[0.12em] text-[13px]">THE</span>
        <span className="font-extrabold tracking-tight text-[15px] mx-[0.12em]">CHANNEL</span>
        <span className="font-light tracking-[0.12em] text-[13px]">CO.</span>
        <span className="font-light text-[7px] self-start ml-[0.15em]">®</span>
      </span>
      <span className="h-1 rounded-sm" style={{ background: TCC_RULE_RED }} />
    </div>
  );
}
