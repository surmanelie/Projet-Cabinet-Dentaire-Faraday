/**
 * Jauge circulaire (anneau) montrant la progression des heures travaillées
 * par rapport aux heures prévues du mois. Affiche au centre les heures faites
 * et, en dessous, les heures manquantes ou supplémentaires.
 */
export default function HoursGauge({
  worked,
  target,
  overtime = 0,
  missing = 0,
  size = 168,
}: {
  worked: number;
  target: number;
  overtime?: number;
  missing?: number;
  size?: number;
}) {
  const r = 52;
  const C = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(worked / target, 1) : 0;
  const offset = C * (1 - pct);
  const over = overtime > 0.05;

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#E8E2D8" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={over ? "#5C6F5E" : "#34423A"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight text-ardoise-900">{worked.toFixed(0)} h</span>
          <span className="text-[10px] uppercase tracking-wide text-ardoise-400">sur {target.toFixed(0)} h prévues</span>
        </div>
      </div>

      <div className="mt-3 min-h-[24px]">
        {over ? (
          <span className="badge bg-faraday-50 text-faraday-700">+{overtime.toFixed(1)} h supplémentaires</span>
        ) : missing > 0.05 ? (
          <span className="badge bg-amber-50 text-amber-800">−{missing.toFixed(1)} h manquantes</span>
        ) : (
          <span className="badge bg-ardoise-100 text-ardoise-500">À jour</span>
        )}
      </div>
    </div>
  );
}
