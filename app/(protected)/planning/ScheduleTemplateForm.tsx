"use client";

import { useState, useTransition } from "react";
import { upsertScheduleTemplateAction } from "@/lib/actions/users";

// Convention identique à Prisma/JS Date.getDay() : 0 = dimanche ... 6 = samedi.
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

type Person = { id: string; firstName: string; lastName: string };

export default function ScheduleTemplateForm({
  users,
  presetUserId,
}: {
  users: Person[];
  presetUserId?: string;
}) {
  const [userId, setUserId] = useState(presetUserId ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <form
      className="grid grid-cols-2 gap-3 md:grid-cols-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!userId) return;
        startTransition(async () => {
          await upsertScheduleTemplateAction({ userId, dayOfWeek, startTime, endTime, breakStart, breakEnd });
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        });
      }}
    >
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
      <div className="col-span-2 md:col-span-6 flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Enregistrer l'horaire type"}
        </button>
        {done && <span className="text-sm text-faraday-600">Horaire type enregistré.</span>}
      </div>
    </form>
  );
}
