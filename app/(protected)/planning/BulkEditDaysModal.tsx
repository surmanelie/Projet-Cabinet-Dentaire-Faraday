"use client";

import { useMemo, useState, useTransition } from "react";
import { computeProgrammedMinutesForMonth } from "@/lib/hours-engine";
import { bulkUpdateWorkEntriesAction } from "@/lib/actions/work-entries";
import { bulkAddFormationAction } from "@/lib/actions/absences";
import type { DayTemplate, DayEntry } from "@/components/MonthAgenda";

const WEEKS_PER_MONTH = 4.33;

type Mode = "horaire" | "formation";

function formatHours(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs % 60);
  return `${sign}${h}h${String(m).padStart(2, "0")}`;
}

/**
 * Modale d'édition en masse des jours sélectionnés sur le calendrier admin.
 * Deux modes : "Horaire de travail" (édite plannedStart/plannedEnd, comme
 * avant) ou "Formation" (crée une absence FORMATION acceptée sur chaque
 * jour, avec un nombre d'heures fixe — jamais mélangée aux heures pointées,
 * voir `markAbsenceInSchedule`). Affiche une barre de synthèse en temps réel
 * (avant → simulation → après) recalculée à chaque changement, AVANT toute
 * sauvegarde — pure simulation côté client (aucun appel serveur nécessaire
 * pour prévisualiser l'impact).
 */
export default function BulkEditDaysModal({
  userId,
  dates,
  year,
  month,
  templatesByDow,
  entriesByDate,
  weeklyContractHours,
  onClose,
  onSaved,
}: {
  userId: string;
  dates: string[];
  year: number;
  month: number;
  templatesByDow: Record<number, DayTemplate>;
  entriesByDate: Record<string, DayEntry>;
  weeklyContractHours: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<Mode>("horaire");
  const [plannedStart, setPlannedStart] = useState("09:00");
  const [plannedEnd, setPlannedEnd] = useState("17:00");
  const [formationHours, setFormationHours] = useState("7");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [skippedLocked, setSkippedLocked] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  const contractMonthlyMinutes = weeklyContractHours * WEEKS_PER_MONTH * 60;

  const baselineMinutes = useMemo(
    () => computeProgrammedMinutesForMonth(templatesByDow, entriesByDate, year, month),
    [templatesByDow, entriesByDate, year, month]
  );

  const simulatedMinutes = useMemo(() => {
    if (mode !== "horaire" || !plannedStart || !plannedEnd) return baselineMinutes;
    const simulated: Record<string, DayEntry> = { ...entriesByDate };
    for (const key of dates) {
      simulated[key] = { ...(simulated[key] ?? { source: "manuel", actualStart: null, actualEnd: null, comment: null }), plannedStart, plannedEnd };
    }
    return computeProgrammedMinutesForMonth(templatesByDow, simulated, year, month);
  }, [mode, templatesByDow, entriesByDate, dates, plannedStart, plannedEnd, year, month, baselineMinutes]);

  const formationTotalMinutes = mode === "formation" ? (Number(formationHours) || 0) * 60 * dates.length : 0;

  const deltaMinutes = mode === "formation" ? formationTotalMinutes : simulatedMinutes - baselineMinutes;
  const totalAfterMinutes = mode === "formation" ? baselineMinutes + formationTotalMinutes : simulatedMinutes;
  const remainingMinutes = contractMonthlyMinutes - totalAfterMinutes;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "horaire") {
      if (!plannedStart || !plannedEnd) {
        setError("Merci de renseigner une heure de début et de fin.");
        return;
      }
      if (plannedStart >= plannedEnd) {
        setError("L'heure de fin doit être après l'heure de début.");
        return;
      }
      startTransition(async () => {
        const res = await bulkUpdateWorkEntriesAction(userId, dates, { plannedStart, plannedEnd, comment: comment.trim() || undefined });
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.skippedLocked?.length) {
          setSkippedLocked(res.skippedLocked);
          return;
        }
        onSaved();
      });
      return;
    }

    const hours = Number(formationHours);
    if (!hours || hours <= 0 || hours > 24) {
      setError("Merci d'indiquer un nombre d'heures de formation valide.");
      return;
    }
    startTransition(async () => {
      const res = await bulkAddFormationAction(userId, dates, hours, comment.trim() || undefined);
      if (res.error) {
        setError(res.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="mt-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="modal-title text-base sm:text-lg">
            Modifier {dates.length} jour{dates.length > 1 ? "s" : ""}
          </h2>
          <button className="text-ardoise-400 hover:text-ardoise-700" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <p className="mb-4 text-xs text-ardoise-500">
          {dates.slice().sort().join(", ")}
        </p>

        <div className="mb-4 flex gap-2 rounded-lg bg-ardoise-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("horaire")}
            className={`flex-1 rounded-md py-1.5 font-medium transition ${mode === "horaire" ? "bg-white text-ardoise-900 shadow-sm" : "text-ardoise-500"}`}
          >
            Horaire de travail
          </button>
          <button
            type="button"
            onClick={() => setMode("formation")}
            className={`flex-1 rounded-md py-1.5 font-medium transition ${mode === "formation" ? "bg-white text-ardoise-900 shadow-sm" : "text-ardoise-500"}`}
          >
            Formation
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "horaire" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Heure de début</label>
                <input
                  type="time"
                  required
                  value={plannedStart}
                  onChange={(e) => setPlannedStart(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Heure de fin</label>
                <input
                  type="time"
                  required
                  value={plannedEnd}
                  onChange={(e) => setPlannedEnd(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="label">Nombre d&apos;heures de formation (par jour)</label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                required
                value={formationHours}
                onChange={(e) => setFormationHours(e.target.value)}
                className="input"
              />
              <p className="mt-1 text-xs text-ardoise-400">
                Chaque jour sélectionné devient une journée de formation acceptée, comptée au contrat.
              </p>
            </div>
          )}
          <div>
            <label className="label">Commentaire (optionnel)</label>
            <input value={comment} onChange={(e) => setComment(e.target.value)} className="input" placeholder="ex : remplacement, ajustement planning…" />
          </div>

          {/* Barre de synthèse en temps réel — avant / simulation / après */}
          <div className="space-y-2 rounded-lg bg-ardoise-50 p-3.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ardoise-500">Heures prévues (contrat, ~mois)</span>
              <span className="font-semibold text-ardoise-900">{formatHours(contractMonthlyMinutes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ardoise-500">Déjà programmées ce mois</span>
              <span className="font-semibold text-ardoise-900">{formatHours(baselineMinutes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ardoise-500">{mode === "formation" ? "Formation ajoutée (sélection)" : "Impact de la sélection"}</span>
              <span className={`font-semibold ${deltaMinutes > 0 ? "text-faraday-700" : deltaMinutes < 0 ? "text-red-700" : "text-ardoise-500"}`}>
                {deltaMinutes === 0 ? "±0h00" : `${deltaMinutes > 0 ? "+" : ""}${formatHours(deltaMinutes)}`}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-ardoise-200 pt-2">
              <span className="text-ardoise-700">Total après modification</span>
              <span className="font-semibold text-ardoise-900">{formatHours(totalAfterMinutes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ardoise-700">
                {remainingMinutes >= 0 ? "Reste à programmer" : "Heures supplémentaires programmées"}
              </span>
              <span className={`font-semibold ${remainingMinutes >= 0 ? "text-ardoise-900" : "text-amber-700"}`}>
                {formatHours(Math.abs(remainingMinutes))}
              </span>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {skippedLocked && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {skippedLocked.length} jour{skippedLocked.length > 1 ? "s" : ""} verrouillé{skippedLocked.length > 1 ? "s" : ""} ignoré{skippedLocked.length > 1 ? "s" : ""}
              {" "}(mois déjà validé) : {skippedLocked.join(", ")}. Les autres jours ont bien été enregistrés.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={pending}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Enregistrement…" : "Valider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
