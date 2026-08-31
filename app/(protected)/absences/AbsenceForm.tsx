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
  const [type, setType] = useState("CONGE_PAYE");
  const isFormation = type === "FORMATION";

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="label">Type d&apos;absence</label>
        <select name="type" required className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{isFormation ? "Date de la formation" : "Date de début"}</label>
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
        {isFormation ? (
          <div>
            <label className="label">Nombre d&apos;heures</label>
            <input
              type="number"
              name="hours"
              step="0.5"
              min="0.5"
              max="24"
              required
              placeholder="ex : 7"
              className="input"
            />
          </div>
        ) : (
          <div>
            <label className="label">Date de fin</label>
            <input type="date" name="endDate" required min={start || today} className="input" />
          </div>
        )}
      </div>
      {isFormation && (
        <p className="text-xs text-ardoise-500">
          Ces heures sont comptées dans votre contrat mais ne sont pas pointées (formation hors cabinet).
        </p>
      )}
      <div>
        <label className="label">Commentaire</label>
        <textarea name="comment" rows={2} className="input" />
      </div>
      {state.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="rounded bg-faraday-50 px-3 py-2 text-sm text-faraday-700">Demande envoyée.</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Envoi..." : "Envoyer la demande"}
      </button>
    </form>
  );
}
