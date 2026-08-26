"use client";

import { useRef, useState, useTransition } from "react";
import { createBackupAction } from "@/lib/actions/backup";

export default function BackupActions() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [restoring, setRestoring] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleRestore() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    if (!confirm("Restaurer cette sauvegarde remplacera toutes les données actuelles. Continuer ?")) return;

    setRestoring(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/backup/restore", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    setRestoring(false);
    if (res.ok) {
      setMessage({ text: "Restauration effectuée. Rechargez l'application." });
    } else {
      setMessage({ text: body.error || "Erreur lors de la restauration.", error: true });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <button
          className="btn-primary"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await createBackupAction();
              setMessage({ text: "Sauvegarde créée." });
            })
          }
        >
          {isPending ? "Sauvegarde..." : "Créer une sauvegarde maintenant"}
        </button>
      </div>

      <div className="rounded border border-dashed border-ardoise-300 p-4">
        <p className="mb-2 text-sm font-medium text-ardoise-700">Restaurer une sauvegarde</p>
        <input ref={fileInput} type="file" accept=".json" className="text-sm" />
        <button className="btn-danger ml-2 text-sm" disabled={restoring} onClick={handleRestore}>
          {restoring ? "Restauration..." : "Restaurer"}
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.error ? "text-red-800" : "text-faraday-700"}`}>{message.text}</p>
      )}
    </div>
  );
}
