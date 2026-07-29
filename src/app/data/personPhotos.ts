/**
 * Central registry of person photos used throughout the portal.
 * All photos use face-crop so the subject's face is always centred.
 * Keys are the person's full name (must match mockData / mockClients exactly).
 */
export const PERSON_PHOTOS: Record<string, string> = {
  // Internal team
  // Brijesh Singh intentionally has no photo — he is named to the client as
  // their campaign manager, so a stock face would misrepresent a real
  // colleague. Initials avatar (BS) renders instead.
  'Arjun Patel':     'https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=faces&fit=crop&w=200&h=200',
  'Michael Chen':    'https://images.unsplash.com/photo-1549320710-0f17830d27bd?crop=faces&fit=crop&w=200&h=200',
  'Emily Rodriguez': 'https://images.unsplash.com/photo-1680204438122-93a6f91a52d3?crop=faces&fit=crop&w=200&h=200',
  'Praful Sanil':    'https://images.unsplash.com/photo-1584940120505-117038d90b05?crop=faces&fit=crop&w=200&h=200',

  // Client-side users
  // Renuka Lawless (demo client) intentionally has no photo — initials avatar renders instead.
  'John Smith':      'https://images.unsplash.com/photo-1758876204244-930299843f07?crop=faces&fit=crop&w=200&h=200',
  'Sarah Johnson':   'https://images.unsplash.com/photo-1736939666660-d4c776e0532c?crop=faces&fit=crop&w=200&h=200',
  'Michael Chen (client)': 'https://images.unsplash.com/photo-1549320710-0f17830d27bd?crop=faces&fit=crop&w=200&h=200',
};

/**
 * Returns the photo URL for a given name, or undefined if not found.
 * Usage: <PersonAvatar name="Brijesh Singh" size={40} />
 */
export function getPersonPhoto(name: string): string | undefined {
  return PERSON_PHOTOS[name];
}
