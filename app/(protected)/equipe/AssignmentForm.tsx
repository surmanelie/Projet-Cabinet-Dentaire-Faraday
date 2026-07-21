"use client";

import { useState, useTransition } from "react";
import { assignAssistantAction } from "@/lib/actions/users";

type Person = { id: string; firstName: string; lastName: string };

export default function AssignmentForm({
  assistants,
  practitioners,
}: {
  assistants: Person[];
  practitioners: Person[];
}) {
  const [assistantId, setAssistantId] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!assistantId || !practitionerId) return;
        startTransition(async () => {
          await assignAssistantAction(assistantId, practitionerId);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        });
      }}
    >
      <div>
        <label className="label">Assistante</label>
        <select className="input" value={assistantId} onChange={(e) => setAssistantId(e.target.value)}>
          <option value="">Choisir...</option>
          {assistants.map((a) => (
            <option key={a.id} value={a.id}>
              {a.firstName} {a.lastName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Praticien</label>
        <select className="input" value={practitionerId} onChange={(e) => setPractitionerId(e.target.value)}>
          <option value="">Choisir...</option>
          {practitioners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Association..." : "Associer"}
      </button>
      {done && <span className="text-sm text-faraday-600">Association créée.</span>}
    </form>
  );
}
