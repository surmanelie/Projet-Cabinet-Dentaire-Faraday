"use client";

import { useActionState, useEffect, useState } from "react";
import { startCheckoutAction, type CheckoutResult } from "@/lib/actions/billing";

const initial: CheckoutResult = {};

export default function InscriptionForm({
  offerId,
  offerName,
  price,
}: {
  offerId: string;
  offerName: string;
  price: string;
}) {
  const [state, formAction, pending] = useActionState(startCheckoutAction, initial);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Redirection vers la page de paiement sécurisée Stripe.
  useEffect(() => {
    if (state.url) window.location.href = state.url;
  }, [state]);

  const pwOk = pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
  const match = pw.length > 0 && pw === pw2;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="offerId" value={offerId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom de l'entreprise" name="company" required />
        <Field label="Raison sociale (optionnel)" name="legal" />
        <Field label="Prénom du responsable" name="firstName" required />
        <Field label="Nom du responsable" name="lastName" required />
        <Field label="E-mail professionnel" name="email" type="email" required />
        <Field label="Téléphone" name="phone" type="tel" />
        <Field label="Adresse" name="address" />
        <Field label="Ville" name="city" />
        <Field label="Code postal" name="zip" />
        <Field label="Pays" name="country" defaultValue="France" />
        <Field label="N° de TVA (optionnel)" name="vat" />
        <Field label="Nombre approximatif de salariés" name="employees" type="number" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type={showPw ? "text" : "password"} required value={pw} onChange={(e) => setPw(e.target.value)} className="input" autoComplete="new-password" />
          {pw.length > 0 && !pwOk && <p className="mt-1 text-xs text-amber-700">Au moins 8 caractères, une lettre et un chiffre.</p>}
        </div>
        <div>
          <label className="label" htmlFor="password2">Confirmer le mot de passe</label>
          <input id="password2" type={showPw ? "text" : "password"} required value={pw2} onChange={(e) => setPw2(e.target.value)} className="input" autoComplete="new-password" />
          {pw2.length > 0 && !match && <p className="mt-1 text-xs text-amber-700">Les mots de passe ne correspondent pas.</p>}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ardoise-600">
        <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
        Afficher les mots de passe
      </label>

      <div className="space-y-2 pt-2">
        <label className="flex items-start gap-2 text-sm text-ardoise-700">
          <input type="checkbox" name="cgu" required className="mt-0.5" />
          <span>J&apos;accepte les <a href="/conditions-generales" className="text-faraday-700 hover:underline">conditions générales</a>.</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-ardoise-700">
          <input type="checkbox" name="rgpd" required className="mt-0.5" />
          <span>J&apos;accepte la <a href="/confidentialite" className="text-faraday-700 hover:underline">politique de confidentialité</a>.</span>
        </label>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button type="submit" disabled={pending || !pwOk || !match} className="btn-primary w-full">
        {pending ? "Redirection vers le paiement…" : `Continuer vers le paiement — ${price} / mois`}
      </button>
      <p className="text-center text-xs text-ardoise-400">
        Offre {offerName}. Paiement sécurisé par Stripe. Aucune donnée bancaire ne transite par nos serveurs.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} required={required} defaultValue={defaultValue} className="input" />
    </div>
  );
}
