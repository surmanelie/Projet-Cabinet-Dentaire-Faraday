"use client";

import { useState } from "react";
import { resetPasswordAction } from "@/lib/actions/users";

export default function ResendInviteButton({ userId }: { userId: string }) {
  const [result, setResult] = useState<{ inviteLink: string; emailSent: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    setPending(true);
    setCopied(false);
    try {
      const res = await resetPasswordAction(userId);
      setResult(res);
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.inviteLink);
    setCopied(true);
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button className="btn-secondary text-xs" onClick={handleClick} disabled={pending}>
        {pending ? "Envoi..." : "Renvoyer l'invitation"}
      </button>
      {result && (
        <p className="max-w-xs text-xs text-ardoise-500">
          {result.emailSent ? (
            "Email envoyé."
          ) : (
            <>
              Email non configuré —{" "}
              <button type="button" onClick={copyLink} className="text-faraday-600 underline">
                {copied ? "lien copié !" : "copier le lien à transmettre"}
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
