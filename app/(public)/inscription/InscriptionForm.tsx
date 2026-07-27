"use client";

import { useState } from "react";

export default function InscriptionForm({ offerName, price }: { offerName: string; price: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);

  function validate(form: HTMLFormElement): string | null {
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Adresse e-mail invalide.";
    if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.";
    if (pw !== pw2) return "Les mots de passe ne correspondent pas.";
    if (!(form.elements.namedItem("cgu") as HTMLInputElement).checked) return "Vous devez accepter les conditions générales.";
    if (!(form.elements.namedItem("rgpd") as HTMLInputElement).checked) return "Vous devez accepter la politique de confidentialité.";
    return null;
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-faraday-200 bg-faraday-50 p-6 text-center">
        <p className="text-lg font-semibold text-faraday-800">Informations enregistrées</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-faraday-800">
          Prochaine étape : le <strong>paiement sécurisé</strong> de votre abonnement, puis la création automatique de
          votre environnement. Le module de paiement (Stripe) est en cours de configuration et sera activé très bientôt.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const err = validate(e.currentTarget);
        if (err) { setError(err); return; }
        setError(null);
        setDone(true);
      }}
    >
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
        <Field label="Nombre approximatif de salariés" name="employees" type="number" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Mot de passe</label>
          <input
            name="password"
            type={showPw ? "text" : "password"}
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="input"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Confirmer le mot de passe</label>
          <input
            name="password2"
            type={showPw ? "text" : "password"}
            required
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="input"
            autoComplete="new-password"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ardoise-600">
        <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
        Afficher les mots de passe
      </label>

      <div className="space-y-2 pt-2">
        <label className="flex items-start gap-2 text-sm text-ardoise-700">
          <input type="checkbox" name="cgu" className="mt-0.5" />
          <span>J&apos;accepte les <a href="/conditions-generales" className="text-faraday-700 hover:underline">conditions générales</a>.</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-ardoise-700">
          <input type="checkbox" name="rgpd" className="mt-0.5" />
          <span>J&apos;accepte la <a href="/confidentialite" className="text-faraday-700 hover:underline">politique de confidentialité</a>.</span>
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn-primary w-full">
        Continuer vers le paiement — {price} / mois
      </button>
      <p className="text-center text-xs text-ardoise-400">
        Offre sélectionnée : {offerName}. Paiement sécurisé à l&apos;étape suivante.
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
