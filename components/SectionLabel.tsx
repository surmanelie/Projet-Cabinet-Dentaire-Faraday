/**
 * Micro-label capitales espacées, avec trait fin — motif graphique signature
 * réutilisé à la place d'une illustration explicite (dent, icône médicale...).
 */
export default function SectionLabel({
  children,
  index,
  tone = "default",
}: {
  children: React.ReactNode;
  index?: string;
  tone?: "default" | "inverted";
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        tone === "inverted" ? "text-creme-100/70" : "text-faraday-500"
      }`}
    >
      <span className="h-px w-8 bg-current opacity-60" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-wider2">
        {index ? `${index} · ` : ""}
        {children}
      </span>
    </div>
  );
}
