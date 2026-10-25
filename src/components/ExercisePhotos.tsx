import type { Guide } from '../domain/guide';

// Bundled, content-hashed photo URLs keyed by file name ("Hammer_Curls-0.jpg").
const URLS = Object.fromEntries(
  Object.entries(import.meta.glob('../photos/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>).map(
    ([path, url]) => [path.split('/').pop()!, url],
  ),
);

export const photoUrl = (set: string, frame: number): string | undefined => URLS[`${set}-${frame}.jpg`];

/**
 * Start and end photos of an exercise, tinted to the app's palette, numbered,
 * with a curved arrow between them. Photos: free-exercise-db (public domain).
 */
export function ExercisePhotos({ photos, name, compact }: { photos: NonNullable<Guide['photos']>; name: string; compact?: boolean }) {
  return (
    <figure className={`photos ${compact ? 'photos-compact' : ''}`} aria-label={`${name}: ${photos.frames.join(', then ')}`}>
      <div className="photos-row">
        {photos.frames.map((label, k) => {
          const src = photoUrl(photos.set, k);
          return (
            <div key={label} className="photo">
              {src && <img src={src} alt="" loading="lazy" decoding="async" />}
              <span className="photo-label">
                <b>{k + 1}</b> · {label}
              </span>
            </div>
          );
        })}
      </div>
      {photos.frames.length > 1 && (
        <svg className="photos-arrow" viewBox="0 0 60 30" aria-hidden="true">
          <defs>
            <marker id="ph-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M1 1 L9 5 L1 9Z" fill="#8EA2FF" />
            </marker>
          </defs>
          <path d="M8 24 Q30 2 52 24" fill="none" stroke="#8EA2FF" strokeWidth="3.5" strokeLinecap="round" markerEnd="url(#ph-arrow)" />
        </svg>
      )}
    </figure>
  );
}
