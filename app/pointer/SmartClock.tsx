"use client";

import { useActionState, useState } from "react";
import { getPinStatus, recordClockByPinAction, type PinStatusResult, type ClockResult } from "@/lib/actions/clock";
import type { ClockAction } from "@prisma/client";

const ACTION_LABELS: Record<ClockAction, string> = {
  DEBUT_JOURNEE: "Commencer la journée",
  DEBUT_PAUSE: "Commencer une pause",
  FIN_PAUSE: "Terminer la pause",
  FIN_JOURNEE: "Terminer la journée",
};

const STATUS_MESSAGE: Record<string, string> = {
  ABSENT: "Vous n'avez pas encore commencé votre journée.",
  PRESENT: "Vous êtes en poste.",
  EN_PAUSE: "Vous êtes en pause.",
  JOURNEE_TERMINEE: "Dernière session terminée — vous pouvez en commencer une nouvelle si besoin.",
};

const initialStatus: PinStatusResult = {};
const initialClock: ClockResult = {};

export default function SmartClock() {
  const [pin, setPin] = useState("");
  const [status, statusAction, statusPending] = useActionState(getPinStatus, initialStatus);
  const [clock, clockAction, clockPending] = useActionState(recordClockByPinAction, initialClock);

  // 3) Confirmation après enregistrement.
  if (clock.success) {
    return (
      <div className="space-y-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-faraday-700 text-faraday-700">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="modal-title">Pointage enregistré</h1>
        <div className="space-y-2.5 rounded border border-ardoise-200 p-5 text-left">
          <Row label="Employé" value={clock.userName ?? "—"} />
          <Row label="Action" value={clock.action ? ACTION_LABELS[clock.action] : "—"} />
          <Row
            label="Heure"
            value={
              clock.timestamp
                ? new Date(clock.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "—"
            }
          />
        </div>
        <p className="text-xs text-ardoise-400">
          Signé électroniquement. Vous pouvez fermer cette page.
        </p>
      </div>
    );
  }

  // 2) Identifié : on propose seulement les bonnes actions.
  if (status.userName && status.allowed) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <p className="text-xs uppercase tracking-wider2 text-ardoise-400">Bonjour</p>
          <h1 className="mt-1 modal-title">{status.userName}</h1>
          <p className="mt-1.5 text-sm text-ardoise-500">{STATUS_MESSAGE[status.status ?? ""] ?? ""}</p>
        </div>

        {clock.error && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{clock.error}</div>
        )}

        {status.allowed.length === 0 ? (
          <p className="rounded border border-ardoise-200 px-4 py-6 text-sm text-ardoise-500">
            Rien à pointer pour le moment — à demain !
          </p>
        ) : (
          <div className="space-y-3">
            {status.allowed.map((action) => (
              <form key={action} action={clockAction}>
                <input type="hidden" name="pin" value={pin} />
                <input type="hidden" name="clockAction" value={action} />
                <button
                  type="submit"
                  disabled={clockPending}
                  className={`w-full rounded py-5 text-base font-medium tracking-wide transition-all duration-300 ease-premium active:scale-[0.98] disabled:opacity-60 ${
                    action === "FIN_JOURNEE"
                      ? "border border-ardoise-300 text-ardoise-800 hover:border-ardoise-900"
                      : "bg-faraday-700 text-creme-50 hover:bg-faraday-800"
                  }`}
                >
                  {ACTION_LABELS[action]}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 1) Saisie du code personnel.
  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="modal-title">Pointage</h1>
        <p className="mt-1 text-sm text-ardoise-500">Entrez votre code personnel à 4 chiffres.</p>
      </div>

      {status.error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{status.error}</div>
      )}

      <form action={statusAction} className="space-y-4">
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          required
          autoFocus
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="••••"
          className="w-full rounded border border-ardoise-300 bg-white py-4 text-center text-3xl tracking-[0.6em] outline-none transition-all duration-200 ease-premium focus:border-faraday-700 focus:ring-1 focus:ring-faraday-700/30"
        />
        <button
          type="submit"
          disabled={statusPending || pin.length !== 4}
          className="w-full rounded bg-faraday-700 py-5 text-base font-medium tracking-wide text-creme-50 transition-all duration-300 ease-premium hover:bg-faraday-800 active:scale-[0.98] disabled:opacity-50"
        >
          {statusPending ? "Vérification…" : "Continuer"}
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-ardoise-700">
      <span className="font-medium text-ardoise-900">{label} :</span> {value}
    </p>
  );
}
