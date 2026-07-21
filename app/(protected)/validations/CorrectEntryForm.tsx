"use client";

import { useState, useTransition } from "react";
import { correctEntryAction, validateEntryAction } from "@/lib/actions/work-entries";

export default function CorrectEntryForm({
  entryId,
  plannedStart,
  plannedEnd,
}: {
  entryId: string;
  plannedStart: string | null;
  plannedEnd: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(plannedStart ?? "");
  const [end, setEnd] = useState(plannedEnd ?? "");
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <div className="flex gap-2">
        <button className="btn-primary text-xs" onClick={() => startTransition(() => validateEntryAction(entryId))} disabled={isPending}>
          Valider
        </button>
        <button className="btn-secondary text-xs" onClick={() => setOpen(true)}>
          Corriger
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-ardoise-200 p-2">
      <div className="flex gap-2">
        <input type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <textarea
        className="input"
        placeholder="Motif de la correction (obligatoire)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="btn-primary text-xs"
          disabled={isPending || !comment.trim()}
          onClick={() =>
            startTransition(async () => {
              await correctEntryAction(entryId, { actualStart: start, actualEnd: end, breakMinutes: 0, comment });
              setOpen(false);
            })
          }
        >
          Enregistrer la correction
        </button>
        <button className="btn-secondary text-xs" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </div>
    </div>
  );
}
