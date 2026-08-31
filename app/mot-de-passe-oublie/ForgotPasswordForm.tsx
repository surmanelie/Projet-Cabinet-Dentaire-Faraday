"use client";

import { useActionState } from "react";
import { requestForgotPasswordAction, type ForgotPasswordResult } from "@/lib/actions/auth";

const initialState: ForgotPasswordResult = {};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestForgotPasswordAction, initialState);

  if (state.submitted) {
    return (
      <p className="text-sm text-faraday-800">
        Si cet email correspond à un compte, l&apos;administrateur a été prévenu et vous transmettra un nouveau mot de passe.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
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
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Envoi..." : "Prévenir l'administrateur"}
      </button>
    </form>
  );
}
