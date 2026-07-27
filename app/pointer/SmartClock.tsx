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
  JOURNEE_TERMINEE: "Votre journée est déjà terminée.",
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
      <div className="space-y-6 text-center">
        <div className="text-7xl">✅</div>
        <h1 className="text-2xl font-bold text-ardoise-900">Pointage enregistré</h1>
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left">
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
        <p className="rounded-lg bg-ardoise-50 px-3 py-2 text-xs text-ardoise-500">
          ✍️ Signé électroniquement. Vous pouvez fermer cette page.
        </p>
      </div>
    );
  }

  // 2) Identifié : on propose seulement les bonnes actions.
  if (status.userName && status.allowed) {
    return (
      <div className="space-y-5 text-center">
        <div>
          <p className="text-sm text-ardoise-400">Bonjour</p>
          <h1 className="text-2xl font-bold text-ardoise-900">{status.userName}</h1>
          <p className="mt-1 text-sm text-ardoise-500">{STATUS_MESSAGE[status.status ?? ""] ?? ""}</p>
        </div>

        {clock.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {clock.error}</div>
        )}

        {status.allowed.length === 0 ? (
          <p className="rounded-xl bg-ardoise-50 px-4 py-6 text-sm text-ardoise-500">
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
                  className={`w-full rounded-2xl py-5 text-lg font-medium text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${
                    action === "FIN_JOURNEE"
                      ? "bg-slate-700 hover:bg-slate-800"
                      : action === "DEBUT_PAUSE"
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-faraday-600 hover:bg-faraday-700"
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
        <h1 className="text-2xl font-bold text-ardoise-900">Pointage</h1>
        <p className="mt-1 text-sm text-ardoise-500">Entrez votre code personnel à 4 chiffres.</p>
      </div>

      {status.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {status.error}</div>
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
          className="w-full rounded-2xl border border-ardoise-200 bg-white py-4 text-center text-3xl tracking-[0.6em] shadow-sm outline-none focus:border-faraday-500"
        />
        <button
          type="submit"
          disabled={statusPending || pin.length !== 4}
          className="w-full rounded-2xl bg-faraday-600 py-5 text-lg font-medium text-white shadow-sm transition hover:bg-faraday-700 active:scale-[0.98] disabled:opacity-50"
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
