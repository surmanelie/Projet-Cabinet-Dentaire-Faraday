"use client";

import { useState, useActionState } from "react";
import {
  editClockEntryAction,
  addClockEntryAction,
} from "@/lib/actions/clock";
import type { ClockAction } from "@prisma/client";

type Entry = {
  id: string;
  userId: string;
  action: ClockAction;
  timestamp: Date;
  source: string;
};

type Assistant = { id: string; firstName: string; lastName: string };

const ACTION_OPTIONS: { value: ClockAction; label: string }[] = [
  { value: "DEBUT_JOURNEE", label: "Début de journée" },
  { value: "DEBUT_PAUSE",   label: "Début de pause" },
  { value: "FIN_PAUSE",     label: "Fin de pause" },
  { value: "FIN_JOURNEE",   label: "Fin de journée" },
];

const ACTION_LABELS: Record<string, string> = {
  DEBUT_JOURNEE: "Début journée",
  DEBUT_PAUSE:   "Début pause",
  FIN_PAUSE:     "Fin pause",
  FIN_JOURNEE:   "Fin journée",
};

// ── Helper: parse datetime-local string → Date ────────────────────────────────
function parseDatetimeLocal(value: string): Date {
  return new Date(value);
}

// ── Edit form ─────────────────────────────────────────────────────────────────
function EditEntryForm({
  entry,
  onClose,
}: {
  entry: Entry;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean }, formData: FormData) => {
      const newTs = parseDatetimeLocal(String(formData.get("newTimestamp")));
      const reason = String(formData.get("reason") ?? "").trim();
      return editClockEntryAction(entry.id, newTs, reason);
    },
    {}
  );

  const defaultTs = entry.timestamp
    .toISOString()
    .slice(0, 16); // "YYYY-MM-DDTHH:mm"

  if (state.success) {
    return (
      <p className="text-sm text-emerald-700">
        ✅ Correction enregistrée.{" "}
        <button className="underline" onClick={onClose}>Fermer</button>
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="label">Nouvelle heure</label>
        <input
          name="newTimestamp"
          type="datetime-local"
          defaultValue={defaultTs}
          required
          className="input"
        />
      </div>
      <div>
        <label className="label">Motif de correction *</label>
        <input
          name="reason"
          type="text"
          required
          placeholder="Ex : assistante a oublié de scanner"
          className="input"
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Enregistrement…" : "Corriger"}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Add form ──────────────────────────────────────────────────────────────────
function AddEntryForm({
  assistants,
  onClose,
}: {
  assistants: Assistant[];
  onClose: () => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean }, formData: FormData) => {
      const userId = String(formData.get("userId"));
      const action = formData.get("action") as ClockAction;
      const ts = parseDatetimeLocal(String(formData.get("timestamp")));
      const reason = String(formData.get("reason") ?? "").trim();
      return addClockEntryAction(userId, action, ts, reason);
    },
    {}
  );

  if (state.success) {
    return (
      <p className="text-sm text-emerald-700">
        ✅ Pointage ajouté.{" "}
        <button className="underline" onClick={onClose}>Fermer</button>
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="label">Assistante</label>
        <select name="userId" required className="input">
          {assistants.map((a) => (
            <option key={a.id} value={a.id}>
              {a.firstName} {a.lastName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Type de pointage</label>
        <select name="action" required className="input">
          {ACTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Heure</label>
        <input
          name="timestamp"
          type="datetime-local"
          defaultValue={`${todayStr}T09:00`}
          required
          className="input"
        />
      </div>
      <div>
        <label className="label">Motif *</label>
        <input
          name="reason"
          type="text"
          required
          placeholder="Ex : assistante a oublié de scanner en arrivant"
          className="input"
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Enregistrement…" : "Ajouter le pointage"}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminClockEdit({
  assistants,
  todayEntries,
}: {
  assistants: Assistant[];
  todayEntries: Entry[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ardoise-900">
          Corrections manuelles
        </h2>
        <button
          onClick={() => { setShowAdd((v) => !v); setEditingId(null); }}
          className="btn-secondary text-xs"
        >
          + Ajouter un pointage oublié
        </button>
      </div>

      {showAdd && (
        <div className="rounded-lg bg-ardoise-50 p-4">
          <p className="mb-3 text-xs text-ardoise-600">
            Ajout d&apos;un pointage oublié — une trace de correction est conservée dans le journal d&apos;audit.
          </p>
          <AddEntryForm assistants={assistants} onClose={() => setShowAdd(false)} />
        </div>
      )}

      {todayEntries.length === 0 ? (
        <p className="text-sm text-ardoise-400">Aucun pointage aujourd&apos;hui.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ardoise-100 text-left text-xs text-ardoise-500">
              <th className="pb-2 pr-4">Assistante</th>
              <th className="pb-2 pr-4">Action</th>
              <th className="pb-2 pr-4">Heure</th>
              <th className="pb-2 pr-4">Source</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ardoise-50">
            {todayEntries.map((e) => {
              const user = assistants.find((a) => a.id === e.userId);
              return (
                <tr key={e.id}>
                  <td className="py-2 pr-4 text-ardoise-700">
                    {user ? `${user.firstName} ${user.lastName}` : "—"}
                  </td>
                  <td className="py-2 pr-4 text-ardoise-700">
                    {ACTION_LABELS[e.action]}
                  </td>
                  <td className="py-2 pr-4 tabular-nums text-ardoise-600">
                    {e.timestamp.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 pr-4">
                    {e.source === "admin" ? (
                      <span className="badge bg-amber-100 text-amber-700">admin</span>
                    ) : (
                      <span className="badge bg-ardoise-100 text-ardoise-500">QR</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => setEditingId(editingId === e.id ? null : e.id)}
                      className="text-xs text-faraday-600 hover:underline"
                    >
                      Corriger
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {editingId && (
        <div className="rounded-lg bg-ardoise-50 p-4">
          <p className="mb-3 text-xs text-ardoise-600">
            Correction d&apos;un pointage — la valeur originale est conservée dans le journal d&apos;audit.
          </p>
          <EditEntryForm
            entry={todayEntries.find((e) => e.id === editingId)!}
            onClose={() => setEditingId(null)}
          />
        </div>
      )}
    </div>
  );
}
