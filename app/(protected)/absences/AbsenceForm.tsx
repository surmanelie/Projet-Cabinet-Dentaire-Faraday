"use client";

import { useActionState, useState } from "react";
import { requestAbsenceAction, type AbsenceFormResult } from "@/lib/actions/absences";

const TYPES: { value: string; label: string }[] = [
  { value: "CONGE_PAYE", label: "Congé payé" },
  { value: "ARRET_MALADIE", label: "Arrêt maladie" },
  { value: "ABSENCE_EXCEPTIONNELLE", label: "Absence exceptionnelle" },
  { value: "ABSENCE_NON_REMUNEREE", label: "Absence non rémunérée" },
  { value: "FORMATION", label: "Formation" },
  { value: "RECUPERATION", label: "Récupération" },
  { value: "AUTRE", label: "Autre" },
];

const initialState: AbsenceFormResult = {};

export default function AbsenceForm() {
  const [state, formAction, pending] = useActionState(requestAbsenceAction, initialState);
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState("");

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="label">Type d'absence</label>
        <select name="type" required className="input">
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date de début</label>
          <input
            type="date"
            name="startDate"
            required
            min={today}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Date de fin</label>
          <input type="date" name="endDate" required min={start || today} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Commentaire</label>
        <textarea name="comment" rows={2} className="input" />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="rounded-lg bg-faraday-50 px-3 py-2 text-sm text-faraday-700">Demande envoyée.</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Envoi..." : "Envoyer la demande"}
      </button>
    </form>
  );
}
