"use client";

import { useActionState } from "react";
import { updateCabinetSettingsAction } from "@/lib/actions/settings";

type Settings = {
  name: string;
  address: string | null;
  timezone: string;
  allowFutureEdits: boolean;
  allowLeaveRequests: boolean;
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
          Autoriser les demandes de congé en libre-service
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-faraday-600">Paramètres enregistrés.</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
