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
    <div className="flex flex-col items-stretch gap-1">
      <button
        role="menuitem"
        className="w-full rounded px-3 py-2 text-left text-sm text-ardoise-800 transition-colors duration-200 ease-premium hover:bg-ardoise-50 disabled:opacity-50"
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? "Envoi..." : "Renvoyer l'invitation"}
      </button>
      {result && (
        <p className="px-3 text-xs text-ardoise-500">
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
