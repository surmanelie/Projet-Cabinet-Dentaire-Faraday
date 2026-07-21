"use client";

import { useState, useTransition } from "react";
import { employeeRespondMonthlyAction } from "@/lib/actions/monthly-validation";

export default function MonthlyResponse({ validationId }: { validationId: string }) {
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return <p className="text-sm text-faraday-600">Votre réponse a été enregistrée.</p>;

  return (
    <div className="mt-3 space-y-2">
      <textarea
        className="input"
        placeholder="Commentaire (optionnel, requis en cas de refus)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="btn-primary text-sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await employeeRespondMonthlyAction(validationId, "VALIDE_SALARIE", comment);
              setDone(true);
            })
          }
        >
          Valider mon récapitulatif
        </button>
        <button
          className="btn-danger text-sm"
          disabled={isPending || !comment.trim()}
          onClick={() =>
            startTransition(async () => {
              await employeeRespondMonthlyAction(validationId, "REFUSE_SALARIE", comment);
              setDone(true);
            })
          }
        >
          Demander une correction
        </button>
      </div>
    </div>
  );
}
