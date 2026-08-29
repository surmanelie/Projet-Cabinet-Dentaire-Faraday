"use client";

import { useState } from "react";
import MonthAgenda, { type DayTemplate, type DayEntry } from "@/components/MonthAgenda";
import BulkEditDaysModal from "@/app/(protected)/planning/BulkEditDaysModal";

/**
 * Wrapper client au-dessus de MonthAgenda : gère l'état de sélection
 * multiple de jours et la barre d'actions (« N jours sélectionnés » /
 * « Modifier les jours sélectionnés » / « Annuler la sélection »), réservé
 * à l'admin/RH. MonthAgenda reste utilisable tel quel en lecture seule
 * ailleurs (espace assistante).
 */
export default function SelectablePlanningCalendar({
  userId,
  year,
  month,
  todayKey,
  templatesByDow,
  entriesByDate,
  prevHref,
  nextHref,
  weeklyContractHours,
}: {
  userId: string;
  year: number;
  month: number;
  todayKey: string;
  templatesByDow: Record<number, DayTemplate>;
  entriesByDate: Record<string, DayEntry>;
  prevHref: string;
  nextHref: string;
  weeklyContractHours: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editOpen, setEditOpen] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const sortedSelected = Array.from(selected).sort();

  return (
    <div className="space-y-3">
      <MonthAgenda
        year={year}
        month={month}
        todayKey={todayKey}
        templatesByDow={templatesByDow}
        entriesByDate={entriesByDate}
        prevHref={prevHref}
        nextHref={nextHref}
        selectable
        selectedDates={selected}
        onToggleDate={toggle}
      />

      {selected.size > 0 && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-faraday-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold text-ardoise-900">
            {selected.size} jour{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => setSelected(new Set())}>
              Annuler la sélection
            </button>
            <button className="btn-primary text-sm" onClick={() => setEditOpen(true)}>
              Modifier les jours sélectionnés
            </button>
          </div>
        </div>
      )}

      {editOpen && (
        <BulkEditDaysModal
          userId={userId}
          dates={sortedSelected}
          year={year}
          month={month}
          templatesByDow={templatesByDow}
          entriesByDate={entriesByDate}
          weeklyContractHours={weeklyContractHours}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
}
