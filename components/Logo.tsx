/**
 * Logo Surmaly — monogramme lettre « S » dans un carré arrondi vert sauge,
 * plus le nom en typographie. Réutilisé partout (menu, connexion, borne).
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect width="40" height="40" rx="11" fill="#2f5041" />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="23"
        fontStyle="italic"
        fontWeight="600"
        fill="#f6f4ef"
      >
        S
      </text>
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
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      {showName && (
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-ardoise-900">Surmaly</p>
          {subtitle && <p className="text-xs text-ardoise-400">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
