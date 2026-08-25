/**
 * Logo Surmaly — monogramme lettre « S » dans un carré vert profond,
 * plus le nom en typographie serif. Réutilisé partout (menu, connexion, borne).
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect width="40" height="40" rx="4" fill="#34423A" />
      <text
        x="20"
        y="21"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        fontSize="23"
        fontStyle="italic"
        fontWeight="500"
        fill="#F7F5F0"
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
