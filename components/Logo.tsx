/**
 * Logo Surmaly — monogramme horloge (clin d'œil à « horaires » + Surman)
 * dans un carré arrondi vert sauge. Réutilisé partout (menu, connexion, borne).
 */
export default function Logo({
  size = 36,
  showName = true,
  subtitle,
}: {
  size?: number;
  showName?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
        <rect width="40" height="40" rx="11" fill="#2f5041" />
        <circle cx="20" cy="20" r="10.5" fill="none" stroke="#f6f4ef" strokeWidth="2.6" />
        <line x1="20" y1="20" x2="20" y2="12.5" stroke="#f6f4ef" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="20" y1="20" x2="25.5" y2="22.5" stroke="#f6f4ef" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      {showName && (
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-ardoise-900">Surmaly</p>
          {subtitle && <p className="text-xs text-ardoise-400">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
