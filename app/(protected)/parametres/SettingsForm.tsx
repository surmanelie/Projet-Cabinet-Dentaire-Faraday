"use client";

import { useActionState } from "react";
import { updateCabinetSettingsAction } from "@/lib/actions/settings";

type Settings = {
  name: string;
  address: string | null;
  timezone: string;
  allowFutureEdits: boolean;
  allowLeaveRequests: boolean;
  cabinetPublicIp: string | null;
};

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, isPending] = useActionState(updateCabinetSettingsAction, { success: false });

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">Nom du cabinet</label>
        <input name="name" className="input" defaultValue={settings.name} required />
      </div>
      <div>
        <label className="label">Adresse</label>
        <input name="address" className="input" defaultValue={settings.address ?? ""} />
      </div>
      <div>
        <label className="label">Fuseau horaire</label>
        <input name="timezone" className="input" defaultValue={settings.timezone} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="allowFutureEdits" id="allowFutureEdits" defaultChecked={settings.allowFutureEdits} />
        <label htmlFor="allowFutureEdits" className="text-sm text-ardoise-700">
          Autoriser la modification anticipée des horaires futurs
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="allowLeaveRequests"
          id="allowLeaveRequests"
          defaultChecked={settings.allowLeaveRequests}
        />
        <label htmlFor="allowLeaveRequests" className="text-sm text-ardoise-700">
          Autoriser les demandes d&apos;absence en libre-service
        </label>
      </div>
      <div>
        <label className="label">Adresse IP publique du cabinet (optionnel)</label>
        <input
          name="cabinetPublicIp"
          className="input"
          placeholder="ex : 90.90.76.153"
          defaultValue={settings.cabinetPublicIp ?? ""}
        />
        <p className="mt-1 text-xs text-ardoise-400">
          Si renseignée, le pointage par QR code / code personnel (page /pointer) n&apos;est accepté que depuis
          cette adresse — pour vérifier que la personne pointe bien depuis le Wi-Fi du cabinet. Laisser vide pour
          désactiver cette restriction.
        </p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-faraday-600">Paramètres enregistrés.</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
