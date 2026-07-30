import { getPersonPhoto } from '../data/personPhotos';

interface PersonAvatarProps {
  name: string;
  /** Photo URL override — if omitted, looks up from PERSON_PHOTOS registry */
  photoUrl?: string;
  size?: number;
  className?: string;
}

/**
 * Rounded-square avatar that shows a real face photo when available,
 * falling back to initials on a red gradient background.
 * Shape is always rounded-xl (square with rounded corners) — never a circle.
 */
export function PersonAvatar({ name, photoUrl, size = 40, className = '' }: PersonAvatarProps) {
  const src = photoUrl || getPersonPhoto(name);
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const style: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: Math.round(size * 0.22), // ~22% → feels like rounded-xl at any size
    overflow: 'hidden',
    flexShrink: 0,
  };

  if (src) {
    return (
      <div style={style} className={`relative ${className}`}>
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          onError={(e) => {
            // On load error, fall back to initials
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.style.background = 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)';
              parent.style.display = 'flex';
              parent.style.alignItems = 'center';
              parent.style.justifyContent = 'center';
              parent.style.color = 'white';
              parent.style.fontWeight = '700';
              parent.style.fontSize = `${Math.round(size * 0.36)}px`;
              parent.textContent = initials;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: Math.round(size * 0.36),
        boxShadow: '0 2px 8px rgba(186,32,39,0.25)',
      }}
      className={className}
    >
      {initials}
    </div>
  );
}
