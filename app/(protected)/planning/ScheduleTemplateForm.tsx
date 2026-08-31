"use client";

import { useState, useTransition } from "react";
import { upsertScheduleTemplateAction } from "@/lib/actions/users";

// Convention identique à Prisma/JS Date.getDay() : 0 = dimanche ... 6 = samedi.
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

type Person = { id: string; firstName: string; lastName: string };
type DayType = "HORAIRE" | "FORMATION";

export default function ScheduleTemplateForm({
  users,
  presetUserId,
}: {
  users: Person[];
  presetUserId?: string;
}) {
  const [userId, setUserId] = useState(presetUserId ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayType, setDayType] = useState<DayType>("HORAIRE");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [formationHours, setFormationHours] = useState("7");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!userId) return;
        startTransition(async () => {
          await upsertScheduleTemplateAction(
            dayType === "FORMATION"
              ? { userId, dayOfWeek, dayType, formationHours: Number(formationHours) }
              : { userId, dayOfWeek, dayType, startTime, endTime, breakStart, breakEnd }
          );
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        });
      }}
    >
      <div className="flex gap-2 rounded-lg bg-ardoise-50 p-1 text-sm md:w-fit">
        <button
          type="button"
          onClick={() => setDayType("HORAIRE")}
          className={`flex-1 rounded-md px-4 py-1.5 font-medium transition ${dayType === "HORAIRE" ? "bg-white text-ardoise-900 shadow-sm" : "text-ardoise-500"}`}
        >
          Horaire de travail
        </button>
        <button
          type="button"
          onClick={() => setDayType("FORMATION")}
          className={`flex-1 rounded-md px-4 py-1.5 font-medium transition ${dayType === "FORMATION" ? "bg-white text-ardoise-900 shadow-sm" : "text-ardoise-500"}`}
        >
          Formation
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {!presetUserId && (
          <div>
            <label className="label">Utilisateur</label>
            <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Choisir...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Jour</label>
          <select className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {dayType === "HORAIRE" ? (
          <>
            <div>
              <label className="label">Début</label>
              <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Fin</label>
              <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Début pause</label>
              <input type="time" className="input" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} />
            </div>
            <div>
              <label className="label">Fin pause</label>
              <input type="time" className="input" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} />
            </div>
          </>
        ) : (
          <div>
            <label className="label">Heures de formation</label>
            <input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              className="input"
              value={formationHours}
              onChange={(e) => setFormationHours(e.target.value)}
            />
          </div>
        )}

        <div className="col-span-2 md:col-span-6 flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Enregistrer le jour type"}
          </button>
          {done && <span className="text-sm text-faraday-600">Jour type enregistré.</span>}
        </div>
      </div>
      {dayType === "FORMATION" && (
        <p className="text-xs text-ardoise-500">
          Chaque {DAYS[dayOfWeek].toLowerCase()} à venir devient une journée de formation acceptée, comptée au
          contrat, jusqu&apos;à ce que ce jour type soit modifié.
        </p>
      )}
    </form>
  );
}
