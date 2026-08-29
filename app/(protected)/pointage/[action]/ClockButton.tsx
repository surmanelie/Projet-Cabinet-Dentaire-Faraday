"use client";

import { useActionState } from "react";
import { recordClockFromFormAction, type ClockResult } from "@/lib/actions/clock";
import type { ClockAction } from "@prisma/client";

interface Info {
  label: string;
  clockAction: ClockAction;
}

const ACTION_INFO: Record<string, Info> = {
  debut:         { label: "Début de journée", clockAction: "DEBUT_JOURNEE" },
  "pause-debut": { label: "Début de pause",   clockAction: "DEBUT_PAUSE" },
  "pause-fin":   { label: "Fin de pause",     clockAction: "FIN_PAUSE" },
  fin:           { label: "Fin de journée",   clockAction: "FIN_JOURNEE" },
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
      <div className="rounded border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
        Action inconnue. Utilisez un QR code valide.
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="space-y-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-faraday-700 text-faraday-700">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="modal-title">Pointage enregistré</h1>
        <div className="space-y-2.5 rounded border border-ardoise-200 p-5 text-left">
          <Row label="Action"     value={info.label} />
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
        <p className="text-xs text-ardoise-400">Vous pouvez fermer cette page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <h1 className="modal-title">{info.label}</h1>
      <p className="text-sm text-ardoise-500">
        Appuyez sur le bouton ci-dessous pour enregistrer ce pointage maintenant.
        L&apos;heure est celle du serveur.
      </p>

      {state.error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="clockAction" value={info.clockAction} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-faraday-700 py-5 text-base font-medium tracking-wide text-creme-50 transition-all duration-300 ease-premium hover:bg-faraday-800 active:scale-[0.98] disabled:opacity-60"
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
