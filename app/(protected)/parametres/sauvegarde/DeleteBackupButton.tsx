"use client";

import { useTransition } from "react";
import { deleteBackupAction } from "@/lib/actions/backup";

export default function DeleteBackupButton({ fileName }: { fileName: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      className="text-xs text-red-600 hover:underline"
      disabled={isPending}
      onClick={() => startTransition(() => deleteBackupAction(fileName))}
    >
      Supprimer
    </button>
  );
}
