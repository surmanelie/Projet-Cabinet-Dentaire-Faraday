"use client";

import { useActionState, useState } from "react";
import { addFormationForAssistantAction, type FormationFormResult } from "@/lib/actions/absences";

type Assistant = { id: string; firstName: string; lastName: string };

const initialState: FormationFormResult = {};

/**
 * L'admin programme directement une journée de formation pour une
 * assistante — les heures de formation sont comptées au contrat mais ne
 * sont jamais pointées (formation hors cabinet).
 */
export default function AddFormationModal({ assistants }: { assistants: Assistant[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addFormationForAssistantAction, initialState);

  if (state.success && open) {
    setTimeout(() => setOpen(false), 800);
  }

  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        + Ajouter une formation
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="modal-title text-base sm:text-lg">Ajouter une formation</h2>
              <button className="text-ardoise-400 hover:text-ardoise-700" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
            </div>
            <p className="mb-4 text-xs text-ardoise-500">
              Ces heures sont comptées dans le contrat de l&apos;assistante mais ne sont pas pointées (formation hors cabinet).
            </p>

            <form action={formAction} className="space-y-3">
              <div>
                <label className="label">Assistante</label>
                <select name="userId" required className="input">
                  <option value="">Choisir...</option>
                  {assistants.map((a) => (
                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input type="date" name="date" required className="input" />
                </div>
                <div>
                  <label className="label">Nombre d&apos;heures</label>
                  <input type="number" name="hours" step="0.5" min="0.5" max="24" required placeholder="ex : 7" className="input" />
                </div>
              </div>
              <div>
                <label className="label">Commentaire (optionnel)</label>
                <input name="comment" className="input" placeholder="ex : formation gestes et postures" />
              </div>

              {state.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
              {state.success && <p className="rounded bg-faraday-50 px-3 py-2 text-sm text-faraday-700">Formation ajoutée.</p>}

              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? "Ajout..." : "Ajouter la formation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
