"use client";

import { useActionState } from "react";
import Link from "next/link";
import { activateAccountAction, type ActivateAccountResult } from "@/lib/actions/auth";

const initialState: ActivateAccountResult = {};

export default function ActivateAccountForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(activateAccountAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-4 text-sm">
        <p className="rounded border border-faraday-200 bg-faraday-50 px-3 py-2.5 text-faraday-800">
          Compte activé ! Tu peux maintenant te connecter avec ton email et ton nouveau mot de passe.
        </p>
        <Link href="/login" className="btn-primary block text-center">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">Nouveau mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">Confirmer le mot de passe</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
      </div>

      {state.error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Activation..." : "Activer mon compte"}
      </button>
    </form>
  );
}
