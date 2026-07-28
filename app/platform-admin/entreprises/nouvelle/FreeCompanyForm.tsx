"use client";

import { useActionState, useState } from "react";
import { createFreeCompanyAction, type PlatformResult } from "@/lib/actions/platform";

const initial: PlatformResult = {};

export default function FreeCompanyForm() {
  const [state, formAction, pending] = useActionState(createFreeCompanyAction, initial);
  const [copied, setCopied] = useState(false);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-faraday-400/30 bg-faraday-500/10 p-5 text-sm text-faraday-100">
        <p className="font-medium text-white">Entreprise créée avec passe offert ✅</p>
        {state.inviteLink ? (
          <>
            <p className="mt-2">Transmettez ce lien au responsable pour qu&apos;il choisisse son mot de passe (valable 7 jours) :</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-black/30 px-2 py-1 text-xs text-ardoise-100">{state.inviteLink}</code>
              <button type="button" onClick={() => { navigator.clipboard.writeText(state.inviteLink!); setCopied(true); }} className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white hover:bg-white/10">
                {copied ? "Copié" : "Copier"}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-2">Le responsable peut se connecter directement avec le mot de passe défini.</p>
        )}
        <a href="/platform-admin/entreprises" className="mt-4 inline-block text-faraday-300 hover:underline">← Retour aux entreprises</a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Nom de l'entreprise" name="name" required />
        <F label="E-mail du responsable" name="email" type="email" required />
        <F label="Prénom du responsable" name="firstName" required />
        <F label="Nom du responsable" name="lastName" required />
        <F label="Gratuit jusqu'au (vide = permanent)" name="freeUntil" type="date" />
        <F label="Mot de passe direct (optionnel)" name="password" type="text" />
      </div>
      <p className="text-xs text-ardoise-400">
        Si vous laissez le mot de passe vide, un lien d&apos;activation sera généré. Aucune carte bancaire n&apos;est
        demandée : c&apos;est un accès offert (« passe gratuit »).
      </p>
      {state.error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-xl bg-faraday-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-faraday-600 disabled:opacity-50">
        {pending ? "Création…" : "Créer l'entreprise (offerte)"}
      </button>
    </form>
  );
}

function F({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-ardoise-400">{label}</label>
      <input name={name} type={type} required={required} className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-ardoise-500 focus:border-faraday-400 focus:outline-none" />
    </div>
  );
}
