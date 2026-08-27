"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction, type ActivateAccountResult } from "@/lib/actions/auth";

const initialState: ActivateAccountResult = {};

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
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
        {pending ? "Enregistrement..." : "Continuer"}
      </button>
    </form>
  );
}
