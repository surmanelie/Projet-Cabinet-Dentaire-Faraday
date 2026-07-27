import PinClockForm from "./PinClockForm";

const VALID_ACTIONS = ["debut", "pause-debut", "pause-fin", "fin"] as const;

/**
 * Borne de pointage PUBLIQUE (accessible sans connexion). L'assistante
 * arrive via le QR code, saisit son code personnel à 4 chiffres et confirme.
 */
export default async function PointerPage({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const { action } = await params;
  const isValid = VALID_ACTIONS.includes(action as (typeof VALID_ACTIONS)[number]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ardoise-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true" className="mb-2">
            <rect width="40" height="40" rx="11" fill="#2f5041" />
            <circle cx="20" cy="20" r="10.5" fill="none" stroke="#f6f4ef" strokeWidth="2.6" />
            <line x1="20" y1="20" x2="20" y2="12.5" stroke="#f6f4ef" strokeWidth="2.6" strokeLinecap="round" />
            <line x1="20" y1="20" x2="25.5" y2="22.5" stroke="#f6f4ef" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          <p className="text-xs uppercase tracking-wide text-ardoise-400">Cabinet Faraday — Pointage</p>
        </div>

        {isValid ? (
          <PinClockForm action={action} />
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-3xl">❌</p>
            <p className="font-semibold text-red-700">QR code invalide</p>
            <p className="text-sm text-ardoise-500">
              Contactez l&apos;administrateur pour obtenir un nouveau QR code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
