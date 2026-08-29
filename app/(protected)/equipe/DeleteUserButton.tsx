"use client";

import { useState, useTransition } from "react";
import { deleteUserAction } from "@/lib/actions/users";

/**
 * Suppression d'un utilisateur avec double confirmation.
 * Affiche l'erreur renvoyée par le serveur (ex : dernier admin, compte propre).
 */
export default function DeleteUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res?.error) {
        setError(res.error);
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-stretch gap-1">
        <button
          role="menuitem"
          className="flex-1 rounded px-3 py-2 text-left text-sm font-medium text-red-700 transition-colors duration-200 ease-premium hover:bg-red-50 disabled:opacity-50"
          disabled={pending}
          onClick={handleDelete}
        >
          {pending ? "Suppression…" : "Confirmer la suppression"}
        </button>
        <button
          role="menuitem"
          className="rounded px-3 py-2 text-sm text-ardoise-600 transition-colors duration-200 ease-premium hover:bg-ardoise-50 disabled:opacity-50"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        role="menuitem"
        className="w-full rounded px-3 py-2 text-left text-sm text-red-700 transition-colors duration-200 ease-premium hover:bg-red-50"
        onClick={() => setConfirming(true)}
        title={`Supprimer ${userName}`}
      >
        Supprimer
      </button>
      {error && <span className="px-3 text-xs text-red-600">{error}</span>}
    </div>
  );
}
