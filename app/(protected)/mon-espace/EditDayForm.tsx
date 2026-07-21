"use client";

import { useActionState } from "react";
import { editTodayAction, type EditDayResult } from "@/lib/actions/work-entries";

const initialState: EditDayResult = {};

export default function EditDayForm({
  defaultStart,
  defaultEnd,
  defaultBreak,
  locked,
}: {
  defaultStart: string;
  defaultEnd: string;
  defaultBreak: number;
  locked: boolean;
}) {
  const [state, formAction, pending] = useActionState(editTodayAction, initialState);

  if (locked) {
    return <p className="text-sm text-ardoise-500">Cette journée est verrouillée (mois validé).</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Heure d'arrivée</label>
          <input type="time" name="start" defaultValue={defaultStart} required className="input" />
        </div>
        <div>
          <label className="label">Heure de départ</label>
          <input type="time" name="end" defaultValue={defaultEnd} required className="input" />
        </div>
      </div>
      <div>
        <label className="label">Pause (minutes)</label>
        <input type="number" name="breakMinutes" defaultValue={defaultBreak} min={0} className="input" />
      </div>
      <div>
        <label className="label">Commentaire (obligatoire en cas de modification)</label>
        <textarea name="comment" required className="input" rows={2} placeholder="Ex: arrivée retardée pour rdv médical" />
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="rounded-lg bg-faraday-50 px-3 py-2 text-sm text-faraday-700">Modification envoyée, en attente de validation RH.</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Envoi..." : "Envoyer"}
      </button>
    </form>
  );
}
