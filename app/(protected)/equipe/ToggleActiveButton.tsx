"use client";
import { toggleActiveAction } from "@/lib/actions/users";

export default function ToggleActiveButton({ userId, active }: { userId: string; active: boolean }) {
  return (
    <button
      className={active ? "btn-danger text-xs" : "btn-secondary text-xs"}
      onClick={() => toggleActiveAction(userId)}
    >
      {active ? "Désactiver" : "Réactiver"}
    </button>
  );
}
