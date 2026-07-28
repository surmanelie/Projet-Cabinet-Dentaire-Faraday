"use client";

import { useState, useTransition } from "react";
import { openBillingPortalAction } from "@/lib/actions/billing";

export default function PortalButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await openBillingPortalAction();
            if (res.url) window.location.href = res.url;
            else setError(res.error ?? "Erreur.");
          })
        }
      >
        {pending ? "Ouverture…" : "Gérer mon abonnement"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
