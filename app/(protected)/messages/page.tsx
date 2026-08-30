import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getContacts, getConversation } from "@/lib/actions/messages";
import SectionLabel from "@/components/SectionLabel";
import { CABINET_TIMEZONE } from "@/lib/timezone";
import MessageForm from "./MessageForm";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "RH",
  PRATICIEN: "Praticien",
  ASSISTANT: "Employé",
  COMPTABLE: "Comptable",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const contacts = await getContacts(session.id);
  const toId = params.to && contacts.some((c) => c.id === params.to) ? params.to : null;
  const active = contacts.find((c) => c.id === toId) ?? null;
  const messages = toId ? await getConversation(session.id, toId) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <SectionLabel>Échanges</SectionLabel>
        <h1 className="mt-3 page-title">Messagerie</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-2 md:col-span-1">
          {contacts.length === 0 ? (
            <p className="p-3 text-sm text-ardoise-400">Aucun contact disponible.</p>
          ) : (
            <ul className="space-y-1">
              {contacts.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/messages?to=${c.id}`}
                    className={`flex items-center gap-3 rounded px-2.5 py-2 transition ${
                      c.id === toId ? "bg-faraday-50" : "hover:bg-ardoise-50"
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.firstName[0]}{c.lastName[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ardoise-900">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="block truncate text-xs text-ardoise-400">{ROLE_LABELS[c.role] ?? c.role}</span>
                    </span>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-faraday-600 px-1.5 text-xs font-medium text-white">
                        {c.unread}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card flex min-h-[420px] flex-col md:col-span-2">
          {active ? (
            <>
              <div className="mb-3 border-b border-ardoise-100 pb-3">
                <p className="font-semibold tracking-tight text-ardoise-900">{active.firstName} {active.lastName}</p>
                <p className="text-xs text-ardoise-400">{ROLE_LABELS[active.role] ?? active.role}</p>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ardoise-400">
                    Aucun message. Écrivez le premier ci-dessous.
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderId === session.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded px-3.5 py-2 text-sm ${
                            mine ? "bg-faraday-600 text-white" : "bg-ardoise-100 text-ardoise-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-ardoise-400"}`}>
                            {m.createdAt.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: CABINET_TIMEZONE })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-3 border-t border-ardoise-100 pt-3">
                <MessageForm recipientId={active.id} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <p className="text-sm text-ardoise-400">Choisissez une personne à gauche pour discuter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
