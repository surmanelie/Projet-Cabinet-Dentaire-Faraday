"use client";

import { useActionState } from "react";
import { recordClockFromFormAction, type ClockResult } from "@/lib/actions/clock";
import type { ClockAction } from "@prisma/client";

interface Info {
  label: string;
  icon: string;
  color: string;
  clockAction: ClockAction;
}

const ACTION_INFO: Record<string, Info> = {
  debut:         { label: "Début de journée", icon: "🌅", color: "bg-emerald-500 hover:bg-emerald-600",  clockAction: "DEBUT_JOURNEE" },
  "pause-debut": { label: "Début de pause",   icon: "☕",  color: "bg-amber-500 hover:bg-amber-600",    clockAction: "DEBUT_PAUSE" },
  "pause-fin":   { label: "Fin de pause",     icon: "▶️",  color: "bg-blue-500 hover:bg-blue-600",      clockAction: "FIN_PAUSE" },
  fin:           { label: "Fin de journée",   icon: "🌙",  color: "bg-slate-700 hover:bg-slate-800",    clockAction: "FIN_JOURNEE" },
};

const initialState: ClockResult = {};

export default function ClockButton({ action }: { action: string }) {
  const info = ACTION_INFO[action];

  const [state, formAction, pending] = useActionState(
    recordClockFromFormAction,
    initialState
  );

  if (!info) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-700">
        ⚠️ Action inconnue. Utilisez un QR code valide.
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-7xl">✅</div>
        <h1 className="text-2xl font-bold text-ardoise-900">Pointage enregistré !</h1>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-left space-y-3">
          <Row label="Action"     value={`${info.icon} ${info.label}`} />
          <Row label="Assistante" value={state.userName ?? "—"} />
          <Row
            label="Heure"
            value={
              state.timestamp
                ? new Date(state.timestamp).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—"
            }
          />
          <Row
            label="Date"
            value={
              state.timestamp
                ? new Date(state.timestamp).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"
            }
          />
        </div>
        <p className="text-sm text-ardoise-400">Vous pouvez fermer cette page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="text-7xl">{info.icon}</div>
      <h1 className="text-2xl font-bold text-ardoise-900">{info.label}</h1>
      <p className="text-sm text-ardoise-500">
        Appuyez sur le bouton ci-dessous pour enregistrer ce pointage maintenant.
        L&apos;heure est celle du serveur.
      </p>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {state.error}
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="clockAction" value={info.clockAction} />
        <button
          type="submit"
          disabled={pending}
          className={`w-full rounded-2xl py-5 text-lg font-semibold text-white transition ${info.color} disabled:opacity-60`}
        >
          {pending ? "Enregistrement…" : `Confirmer — ${info.label}`}
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
