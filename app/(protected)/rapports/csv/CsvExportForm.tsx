"use client";

import { useState } from "react";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function CsvExportForm() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

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
      <a href={`/api/reports/csv?month=${month}&year=${year}`} className="btn-primary inline-block">
        Télécharger le CSV
      </a>
      <p className="text-xs text-ardoise-500">
        Format compatible Excel : séparateur point-virgule, dates françaises, encodage UTF-8.
      </p>
    </div>
  );
}
