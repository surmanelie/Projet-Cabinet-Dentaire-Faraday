import { LogoMark } from "@/components/Logo";
import SmartClock from "./SmartClock";

/**
 * Borne de pointage à QR code UNIQUE : l'employé scanne, saisit son code,
 * et n'obtient que les actions valides selon son état du moment.
 */
export default function PointerPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ardoise-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-2">
            <LogoMark size={46} />
          </div>
          <p className="text-xs uppercase tracking-wide text-ardoise-400">Cabinet Faraday — Pointage</p>
        </div>
        <SmartClock />
      </div>
    </div>
  );
}
