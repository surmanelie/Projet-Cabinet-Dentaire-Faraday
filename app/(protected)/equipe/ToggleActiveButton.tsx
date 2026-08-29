"use client";
import { toggleActiveAction } from "@/lib/actions/users";

export default function ToggleActiveButton({ userId, active }: { userId: string; active: boolean }) {
  return (
    <button
      role="menuitem"
      className={`w-full rounded px-3 py-2 text-left text-sm transition-colors duration-200 ease-premium hover:bg-ardoise-50 ${
        active ? "text-red-700" : "text-ardoise-800"
      }`}
      onClick={() => toggleActiveAction(userId)}
    >
      {active ? "Désactiver" : "Réactiver"}
    </button>
  );
}
