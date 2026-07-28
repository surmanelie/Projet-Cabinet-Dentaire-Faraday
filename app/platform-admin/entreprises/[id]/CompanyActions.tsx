"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  suspendCompanyAction,
  reactivateCompanyAction,
  cancelSubscriptionOwnerAction,
  saveInternalNoteAction,
} from "@/lib/actions/platform";

export default function CompanyActions({
  companyId,
  companyName,
  status,
  note,
  hasSubscription,
}: {
  companyId: string;
  companyName: string;
  status: string;
  note: string;
  hasSubscription: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [noteVal, setNoteVal] = useState(note);

  function run(fn: () => Promise<{ error?: string; success?: boolean }>) {
    setMsg(null);
    start(async () => {
      const r = await fn();
      if (r?.error) setMsg(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {status === "SUSPENDED" ? (
          <button disabled={pending} onClick={() => run(() => reactivateCompanyAction(companyId))}
            className="rounded-xl bg-faraday-500 px-4 py-2 text-sm font-medium text-white hover:bg-faraday-600 disabled:opacity-50">
            Réactiver l&apos;accès
          </button>
        ) : (
          <button disabled={pending} onClick={() => {
            const reason = prompt("Motif de la suspension (obligatoire) :");
            if (reason) run(() => suspendCompanyAction(companyId, reason));
          }}
            className="rounded-xl border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/10 disabled:opacity-50">
            Suspendre l&apos;accès
          </button>
        )}

        {hasSubscription && (
          <>
            <button disabled={pending} onClick={() => {
              const reason = prompt("Motif de la résiliation à la fin de période :");
              if (reason) run(() => cancelSubscriptionOwnerAction(companyId, false, reason));
            }}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50">
              Résilier à la fin de période
            </button>
            <button disabled={pending} onClick={() => {
              const typed = prompt(`Résiliation IMMÉDIATE. Tapez le nom exact de l'entreprise pour confirmer :\n« ${companyName} »`);
              if (typed !== companyName) { if (typed !== null) setMsg("Le nom ne correspond pas — action annulée."); return; }
              const reason = prompt("Motif de la résiliation immédiate :");
              if (reason) run(() => cancelSubscriptionOwnerAction(companyId, true, reason));
            }}
              className="rounded-xl border border-red-400/40 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50">
              Résilier immédiatement
            </button>
          </>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-ardoise-400">Note administrative interne</label>
        <textarea value={noteVal} onChange={(e) => setNoteVal(e.target.value)} rows={2}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-ardoise-500 focus:border-faraday-400 focus:outline-none" />
        <button disabled={pending} onClick={() => run(() => saveInternalNoteAction(companyId, noteVal))}
          className="mt-2 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/10 disabled:opacity-50">
          Enregistrer la note
        </button>
      </div>

      {msg && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{msg}</p>}
    </div>
  );
}
