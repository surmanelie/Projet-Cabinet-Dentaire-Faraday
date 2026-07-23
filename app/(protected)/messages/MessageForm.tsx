"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessageAction, type MessageResult } from "@/lib/actions/messages";

const initialState: MessageResult = {};

export default function MessageForm({ recipientId }: { recipientId: string }) {
  const [state, formAction, pending] = useActionState(sendMessageAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Vide le champ après un envoi réussi.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="recipientId" value={recipientId} />
      <textarea
        name="body"
        rows={1}
        required
        placeholder="Écrire un message…"
        className="input flex-1 resize-none"
      />
      <button type="submit" disabled={pending} className="btn-primary shrink-0">
        {pending ? "…" : "Envoyer"}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
