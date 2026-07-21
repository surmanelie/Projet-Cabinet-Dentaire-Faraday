"use client";

import { useState, useTransition } from "react";
import { generateMonthlyRecapAction } from "@/lib/actions/monthly-validation";

type Person = { id: string; firstName: string; lastName: string };

export default function GenerateRecapForm({ users, month, year }: { users: Person[]; month: number; year: number }) {
  const [userId, setUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-end gap-3">
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
      <button
        className="btn-primary"
        disabled={!userId || isPending}
        onClick={() =>
          startTransition(() => {
            void generateMonthlyRecapAction(userId, month, year);
          })
        }
      >
        {isPending ? "Génération..." : "Générer / renvoyer le récapitulatif"}
      </button>
    </div>
  );
}
