import PinClockForm from "./PinClockForm";
import { LogoMark } from "@/components/Logo";

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
          <div className="mb-2">
            <LogoMark size={46} />
          </div>
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
