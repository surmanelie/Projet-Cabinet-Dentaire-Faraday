"use client";

import { reviewAbsenceAction } from "@/lib/actions/absences";

export default function ReviewButtons({ absenceId }: { absenceId: string }) {
  return (
    <div className="flex gap-2">
      <button
        className="btn-primary text-xs"
        onClick={() => reviewAbsenceAction(absenceId, "ACCEPTE")}
      >
        Accepter
      </button>
      <button
        className="btn-danger text-xs"
        onClick={() => reviewAbsenceAction(absenceId, "REFUSE")}
      >
        Refuser
      </button>
    </div>
  );
}
