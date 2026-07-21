"use client";

import { useTransition } from "react";
import { rhValidateMonthlyAction, lockMonthlyValidationAction } from "@/lib/actions/monthly-validation";

export default function ValidationActions({ validationId, status }: { validationId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {(status === "VALIDE_SALARIE" || status === "REFUSE_SALARIE") && (
        <button
          className="btn-primary text-xs"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void rhValidateMonthlyAction(validationId);
            })
          }
        >
          Valider (RH)
        </button>
      )}
      {status === "VALIDE_RH" && (
        <button
          className="btn-danger text-xs"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void lockMonthlyValidationAction(validationId);
            })
          }
        >
          Verrouiller le mois
        </button>
      )}
    </div>
  );
}
