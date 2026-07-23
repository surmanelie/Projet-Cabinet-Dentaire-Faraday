"use client";

import { useActionState, useState } from "react";
import { createUserAction, updateUserAction, type UserFormResult } from "@/lib/actions/users";

const initialState: UserFormResult = {};

export type EditableUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  color: string;
  role: string;
  hasClockPin?: boolean;
  assistantProfile?: { contractType: string; weeklyContractHours: number; notes: string | null } | null;
  practitionerProfile?: { specialty: string | null; room: string | null } | null;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "RH / Responsable",
  PRATICIEN: "Praticien",
  ASSISTANT: "Employé",
  COMPTABLE: "Comptable (lecture seule)",
};

/**
 * Formulaire de création OU de modification d'un utilisateur.
 * - Sans `user` : mode création (rôle choisi, mot de passe direct optionnel
 *   sinon invitation par lien).
 * - Avec `user` : mode édition (rôle figé, mot de passe optionnel pour
 *   réinitialiser).
 */
export default function UserForm({
  user,
  onDone,
}: {
  user?: EditableUser;
  onDone?: () => void;
}) {
  const isEdit = Boolean(user);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateUserAction : createUserAction,
    initialState
  );
  const [role, setRole] = useState(user?.role ?? "ASSISTANT");
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");
  const [clockPin, setClockPin] = useState("");

  function generatePassword() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pw = "";
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pw + "9a");
  }

  function generatePin() {
    setClockPin(String(Math.floor(1000 + Math.random() * 9000)));
  }

  // Ferme le modal en édition dès que la sauvegarde réussit.
  if (isEdit && state.success && onDone) {
    setTimeout(onDone, 400);
  }

  async function copyLink() {
    if (!state.inviteLink) return;
    await navigator.clipboard.writeText(state.inviteLink);
    setCopied(true);
  }

  return (
    <form action={formAction} className="space-y-3">
      {isEdit && <input type="hidden" name="userId" value={user!.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Prénom</label>
          <input name="firstName" required className="input" defaultValue={user?.firstName} />
        </div>
        <div>
          <label className="label">Nom</label>
          <input name="lastName" required className="input" defaultValue={user?.lastName} />
        </div>
      </div>
      <div>
        <label className="label">Email / identifiant</label>
        <input name="email" type="email" required className="input" defaultValue={user?.email} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Téléphone</label>
          <input name="phone" className="input" defaultValue={user?.phone ?? ""} />
        </div>
        <div>
          <label className="label">Couleur planning</label>
          <input name="color" type="color" defaultValue={user?.color ?? "#3f7e75"} className="input h-10" />
        </div>
      </div>

      {isEdit ? (
        <div>
          <label className="label">Rôle</label>
          <input className="input bg-ardoise-50" value={ROLE_LABELS[role] ?? role} readOnly />
        </div>
      ) : (
        <div>
          <label className="label">Rôle</label>
          <select name="role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ADMIN">Administrateur</option>
            <option value="RH">RH / Responsable</option>
            <option value="PRATICIEN">Praticien</option>
            <option value="ASSISTANT">Employé</option>
            <option value="COMPTABLE">Comptable (lecture seule)</option>
          </select>
        </div>
      )}

      {role === "ASSISTANT" && (
        <div className="space-y-3 rounded-lg bg-ardoise-50 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type de contrat</label>
              <select
                name="contractType"
                className="input"
                defaultValue={user?.assistantProfile?.contractType ?? "TEMPS_PLEIN"}
              >
                <option value="TEMPS_PLEIN">Temps plein</option>
                <option value="TEMPS_PARTIEL">Temps partiel</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div>
              <label className="label">Heures contractuelles / semaine</label>
              <input
                name="weeklyContractHours"
                type="number"
                step="0.5"
                defaultValue={user?.assistantProfile?.weeklyContractHours ?? 35}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Notes internes (optionnel)</label>
            <textarea
              name="notes"
              rows={2}
              className="input"
              defaultValue={user?.assistantProfile?.notes ?? ""}
            />
          </div>
          <div>
            <label className="label">
              Code de pointage (4 chiffres)
              {isEdit && user?.hasClockPin ? " — un code est défini" : ""}
            </label>
            <div className="flex gap-2">
              <input
                name="clockPin"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={clockPin}
                onChange={(e) => setClockPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="input tracking-[0.4em]"
                autoComplete="off"
                placeholder={isEdit && user?.hasClockPin ? "•••• (laisser vide pour garder)" : "ex : 4271"}
              />
              <button type="button" onClick={generatePin} className="btn-secondary whitespace-nowrap text-xs">
                Générer
              </button>
            </div>
            <p className="mt-1 text-xs text-ardoise-400">
              Ce code personnel permet à l&apos;assistante de pointer via QR code, sans se connecter.
            </p>
          </div>
        </div>
      )}

      {role === "PRATICIEN" && (
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-ardoise-50 p-3">
          <div>
            <label className="label">Spécialité</label>
            <input name="specialty" className="input" defaultValue={user?.practitionerProfile?.specialty ?? ""} />
          </div>
          <div>
            <label className="label">Salle / cabinet</label>
            <input name="room" className="input" defaultValue={user?.practitionerProfile?.room ?? ""} />
          </div>
        </div>
      )}

      <div>
        <label className="label">
          Mot de passe {isEdit ? "(laisser vide pour ne pas changer)" : "(optionnel)"}
        </label>
        <div className="flex gap-2">
          <input
            name="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="off"
            placeholder={isEdit ? "Nouveau mot de passe…" : "Laisser vide pour envoyer un lien d'invitation"}
          />
          <button type="button" onClick={generatePassword} className="btn-secondary whitespace-nowrap text-xs">
            Générer
          </button>
        </div>
        <p className="mt-1 text-xs text-ardoise-400">
          {isEdit
            ? "Si rempli, le mot de passe est remplacé immédiatement (min. 8 caractères)."
            : "Si rempli, l'assistante se connecte directement avec ce mot de passe (min. 8 caractères). Sinon, un lien d'activation est généré."}
        </p>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && !state.inviteLink && (
        <p className="rounded-lg bg-faraday-50 px-3 py-2 text-sm text-faraday-700">
          {isEdit ? "Modifications enregistrées." : "Compte créé avec le mot de passe défini."}
        </p>
      )}
      {state.success && state.inviteLink && (
        <div className="rounded-lg bg-faraday-50 px-3 py-2 text-sm text-faraday-700">
          {state.emailSent ? (
            <p>Compte créé. Un email d&apos;invitation a été envoyé pour que la personne crée son mot de passe.</p>
          ) : (
            <>
              <p>
                Compte créé. L&apos;envoi automatique d&apos;email n&apos;est pas encore configuré : transmets ce
                lien à la personne pour qu&apos;elle crée son mot de passe (valable 7 jours).
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-white px-2 py-1 text-xs">{state.inviteLink}</code>
                <button type="button" onClick={copyLink} className="btn-secondary text-xs whitespace-nowrap">
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending
          ? isEdit
            ? "Enregistrement…"
            : "Création…"
          : isEdit
            ? "Enregistrer les modifications"
            : "Créer l'utilisateur"}
      </button>
    </form>
  );
}
