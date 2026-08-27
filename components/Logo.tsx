/**
 * Logo Surmaly — cadran de montre minimaliste (aiguilles à 10h10, la
 * position classique et équilibrée de l'horlogerie), dans le même esprit
 * que les traits fins déjà utilisés dans la direction artistique
 * (SectionLabel, séparateurs) — cohérent avec le propos de l'app : la
 * gestion du temps. Réutilisé partout (menu, connexion, borne).
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect width="40" height="40" rx="4" fill="#34423A" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="#F7F5F0" strokeWidth="1" />
      <line x1="20" y1="7.5" x2="20" y2="9.5" stroke="#F7F5F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="32.5" y1="20" x2="30.5" y2="20" stroke="#F7F5F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="20" y1="32.5" x2="20" y2="30.5" stroke="#F7F5F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="7.5" y1="20" x2="9.5" y2="20" stroke="#F7F5F0" strokeWidth="1" strokeLinecap="round" />
      <line x1="20" y1="20" x2="15.1" y2="16.6" stroke="#F7F5F0" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="20" x2="27.8" y2="15.5" stroke="#F7F5F0" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="20" cy="20" r="1.3" fill="#F7F5F0" />
    </svg>
  );
}

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
    <div className="flex items-center gap-3">
      <LogoMark size={size} />
      {showName && (
        <div className="leading-tight">
          <p className="font-serif text-lg italic tracking-tight text-ardoise-900">Surmaly</p>
          {subtitle && (
            <p className="text-[10px] font-medium uppercase tracking-wider2 text-ardoise-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
