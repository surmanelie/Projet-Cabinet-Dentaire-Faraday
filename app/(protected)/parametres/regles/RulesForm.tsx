"use client";

import { useActionState } from "react";
import { updateRulesConfigAction } from "@/lib/actions/settings";
import type { RulesConfig } from "@/lib/hours-engine";

export default function RulesForm({ rules }: { rules: RulesConfig }) {
  const [state, action, isPending] = useActionState(updateRulesConfigAction, { success: false });

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="label">Seuil hebdomadaire temps plein (h)</label>
          <input
            type="number"
            step="0.5"
            name="fullTimeWeeklyThreshold"
            className="input"
            defaultValue={rules.fullTimeWeeklyThreshold}
          />
        </div>
        <div>
          <label className="label">Borne heures sup. majoration 25% (jusqu&apos;à, h/semaine)</label>
          <input
            type="number"
            step="0.5"
            name="overtimeTier1UpToHours"
            className="input"
            defaultValue={rules.overtimeTier1UpToHours}
          />
        </div>
        <div>
          <label className="label">Taux majoration heures sup. tranche 1</label>
          <input
            type="number"
            step="0.01"
            name="overtimeTier1Rate"
            className="input"
            defaultValue={rules.overtimeTier1Rate}
          />
        </div>
        <div>
          <label className="label">Taux majoration heures sup. tranche 2 (au-delà)</label>
          <input
            type="number"
            step="0.01"
            name="overtimeTier2Rate"
            className="input"
            defaultValue={rules.overtimeTier2Rate}
          />
        </div>
        <div>
          <label className="label">Heures complémentaires temps partiel — seuil (% du contrat)</label>
          <input
            type="number"
            step="0.01"
            name="partTimeComplementaryTier1Pct"
            className="input"
            defaultValue={rules.partTimeComplementaryTier1Pct}
          />
        </div>
        <div>
          <label className="label">Taux majoration tranche 1 (temps partiel)</label>
          <input
            type="number"
            step="0.01"
            name="partTimeComplementaryTier1Rate"
            className="input"
            defaultValue={rules.partTimeComplementaryTier1Rate}
          />
        </div>
        <div>
          <label className="label">Taux majoration tranche 2 (temps partiel)</label>
          <input
            type="number"
            step="0.01"
            name="partTimeComplementaryTier2Rate"
            className="input"
            defaultValue={rules.partTimeComplementaryTier2Rate}
          />
        </div>
        <div>
          <label className="label">Arrondi des horaires</label>
          <select name="rounding" className="input" defaultValue={rules.rounding}>
            <option value="EXACT">Exact (aucun arrondi)</option>
            <option value="FIVE_MIN">Arrondi à 5 minutes</option>
            <option value="FIFTEEN_MIN">Arrondi à 15 minutes</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-ardoise-500">
        Rappel : les déficits (heures manquantes) et les ajustements manuels ne sont jamais majorés, quelle que soit
        la configuration ci-dessus.
      </p>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-faraday-600">Règles enregistrées.</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer les règles"}
      </button>
    </form>
  );
}
