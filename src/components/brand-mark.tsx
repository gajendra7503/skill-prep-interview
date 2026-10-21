/**
 * The SkillPrep logo mark: an "S" whose top stroke ends in a forward arrow — skills, moving forward.
 * Size it with height/width classes. Keep in sync with src/app/icon.svg and public/brand/.
 */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id="skillprep-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset="0.6" stopColor="#9333ea" />
          <stop offset="1" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#skillprep-mark)" />
      <g transform="translate(-0.25 0.6)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.5 10h-7a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6h-7.5" stroke="#fff" strokeWidth="3.2" />
        <path d="M19.25 6.75 22.5 10l-3.25 3.25" stroke="#fde047" strokeWidth="2.8" />
      </g>
    </svg>
  );
}
