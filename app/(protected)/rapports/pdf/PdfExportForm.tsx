"use client";

import { useState } from "react";

type Person = { id: string; firstName: string; lastName: string };

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function PdfExportForm({
  canSeeGlobal,
  users,
  ownUserId,
  isAdminOrRh,
}: {
  canSeeGlobal: boolean;
  users: Person[];
  ownUserId: string;
  isAdminOrRh: boolean;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [scope, setScope] = useState<"employee" | "global">("employee");
  const [userId, setUserId] = useState(ownUserId);

  const href = `/api/reports/pdf?month=${month}&year=${year}&scope=${scope}${
    scope === "employee" ? `&userId=${userId}` : ""
  }`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Mois</label>
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Année</label>
          <input type="number" className="input" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      {canSeeGlobal && (
        <div>
          <label className="label">Type d&apos;export</label>
          <select className="input" value={scope} onChange={(e) => setScope(e.target.value as "employee" | "global")}>
            <option value="employee">Récapitulatif individuel</option>
            <option value="global">Synthèse comptable globale</option>
          </select>
        </div>
      )}

      {scope === "employee" && isAdminOrRh && (
        <div>
          <label className="label">Salarié</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value={ownUserId}>Moi-même</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      <a href={href} className="btn-primary inline-block">
        Télécharger le PDF
      </a>
    </div>
  );
}
