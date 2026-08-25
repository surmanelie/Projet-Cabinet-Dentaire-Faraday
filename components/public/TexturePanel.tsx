/**
 * Panneau texturé — tient lieu de photographie tant qu'aucun visuel réel
 * n'est disponible. Dégradés doux + fine courbe organique (motif signature,
 * évocation très indirecte d'un sourire/d'une architecture — jamais une
 * illustration de dent). Prévu pour être remplacé par une vraie image plus
 * tard sans changer la mise en page (même ratio, même classe conteneur).
 */
export default function TexturePanel({
  tone = "sage",
  className = "",
}: {
  tone?: "sage" | "deep" | "ivory";
  className?: string;
}) {
  const bg =
    tone === "deep"
      ? "linear-gradient(155deg, #34423A 0%, #283329 55%, #1C241D 100%)"
      : tone === "ivory"
        ? "linear-gradient(155deg, #F7F5F0 0%, #EFEBE2 55%, #E8E2D8 100%)"
        : "linear-gradient(155deg, #C3CEC0 0%, #A2B29C 55%, #7B8B7C 100%)";

  const stroke = tone === "ivory" ? "#34423A" : "#F7F5F0";

  return (
    <div
      className={`relative overflow-hidden rounded-md ${className}`}
      style={{ background: bg }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full opacity-[0.35]"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M -20 260 C 100 340, 300 340, 420 220"
          fill="none"
          stroke={stroke}
          strokeWidth="1"
        />
        <path
          d="M -20 300 C 120 380, 320 300, 420 180"
          fill="none"
          stroke={stroke}
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}
