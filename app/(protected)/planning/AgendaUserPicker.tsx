"use client";

import { useRouter } from "next/navigation";

type Person = { id: string; firstName: string; lastName: string; role: string };

/** Menu déroulant pour choisir la personne dont on affiche l'agenda. */
export default function AgendaUserPicker({
  users,
  selectedId,
  month,
  year,
}: {
  users: Person[];
  selectedId: string;
  month: number;
  year: number;
}) {
  const router = useRouter();
  return (
    <select
      className="input max-w-xs text-base"
      value={selectedId}
      onChange={(e) => router.push(`/planning?user=${e.target.value}&month=${month}&year=${year}`)}
    >
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.firstName} {u.lastName}
          {u.role === "PRATICIEN" ? " (praticien)" : ""}
        </option>
      ))}
    </select>
  );
}
