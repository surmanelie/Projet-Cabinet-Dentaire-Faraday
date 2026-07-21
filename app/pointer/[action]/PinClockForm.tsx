"use client";

import { useActionState, useState } from "react";
import { recordClockByPinAction, type ClockResult } from "@/lib/actions/clock";
import type { ClockAction } from "@prisma/client";

interface Info {
  label: string;
  icon: string;
  color: string;
  clockAction: ClockAction;
}

const ACTION_INFO: Record<string, Info> = {
  debut: { label: "Début de journée", icon: "🌅", color: "bg-emerald-500 hover:bg-emerald-600", clockAction: "DEBUT_JOURNEE" },
  "pause-debut": { label: "Début de pause", icon: "☕", color: "bg-amber-500 hover:bg-amber-600", clockAction: "DEBUT_PAUSE" },
  "pause-fin": { label: "Fin de pause", icon: "▶️", color: "bg-blue-500 hover:bg-blue-600", clockAction: "FIN_PAUSE" },
  fin: { label: "Fin de journée", icon: "🌙", color: "bg-slate-700 hover:bg-slate-800", clockAction: "FIN_JOURNEE" },
};

const initialState: ClockResult = {};

export default function PinClockForm({ action }: { action: string }) {
  const info = ACTION_INFO[action];
  const [state, formAction, pending] = useActionState(recordClockByPinAction, initialState);
  const [pin, setPin] = useState("");

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
        <h1 className="text-2xl font-bold text-ardoise-900">Pointage enregistré</h1>
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-left">
          <Row label="Action" value={`${info.icon} ${info.label}`} />
          <Row label="Assistante" value={state.userName ?? "—"} />
          <Row
            label="Heure"
            value={
              state.timestamp
                ? new Date(state.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "—"
            }
          />
          <Row
            label="Date"
            value={
              state.timestamp
                ? new Date(state.timestamp).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                : "—"
            }
          />
        </div>
        <p className="rounded-lg bg-ardoise-50 px-3 py-2 text-xs text-ardoise-500">
          ✍️ Signé électroniquement par saisie du code personnel. Vous pouvez fermer cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="text-7xl">{info.icon}</div>
      <h1 className="text-2xl font-bold text-ardoise-900">{info.label}</h1>
      <p className="text-sm text-ardoise-500">
        Entrez votre code personnel à 4 chiffres, puis confirmez. L&apos;heure enregistrée est celle du serveur.
      </p>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {state.error}</div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="clockAction" value={info.clockAction} />
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
          className="w-full rounded-2xl border border-ardoise-200 bg-white py-4 text-center text-3xl tracking-[0.6em] outline-none focus:border-faraday-500"
        />
        <button
          type="submit"
          disabled={pending || pin.length !== 4}
          className={`w-full rounded-2xl py-5 text-lg font-semibold text-white transition ${info.color} disabled:opacity-50`}
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
