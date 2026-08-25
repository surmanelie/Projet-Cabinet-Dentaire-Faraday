"use client";

import { useActionState } from "react";
import { loginAction, type LoginResult } from "@/lib/actions/auth";

const initialState: LoginResult = {};

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="input"
          placeholder="prenom.nom@cabinet-faraday.fr"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ardoise-600">
        <input type="checkbox" name="remember" className="rounded border-ardoise-300" />
        Rester connecté
      </label>

      {state.error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
