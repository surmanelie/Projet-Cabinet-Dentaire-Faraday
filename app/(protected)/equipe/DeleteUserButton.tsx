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
      <span className="inline-flex items-center gap-1">
        <button className="btn-danger text-xs" disabled={pending} onClick={handleDelete}>
          {pending ? "Suppression…" : "Confirmer"}
        </button>
        <button className="btn-secondary text-xs" disabled={pending} onClick={() => setConfirming(false)}>
          Annuler
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        className="btn-danger text-xs"
        onClick={() => setConfirming(true)}
        title={`Supprimer ${userName}`}
      >
        Supprimer
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
