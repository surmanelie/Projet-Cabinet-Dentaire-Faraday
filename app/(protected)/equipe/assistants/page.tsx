import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AssignmentForm from "../AssignmentForm";

export default async function AssistantsPage() {
  const session = await getSession();

  const assistants = await prisma.user.findMany({
    where: { role: "ASSISTANT" },
    include: {
      assistantProfile: true,
      assignmentsAsAssistant: {
        where: { active: true },
        include: { practitioner: true },
      },
    },
    orderBy: { lastName: "asc" },
  });

  const practitioners = await prisma.user.findMany({
    where: { role: "PRATICIEN", active: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });

  const isAdminOrRh = session?.role === "ADMIN" || session?.role === "RH";
  const activeAssistants = assistants.filter((a) => a.active);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ardoise-900">Assistantes</h1>

      {isAdminOrRh && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Associer une assistante à un praticien</h2>
          <AssignmentForm assistants={activeAssistants} practitioners={practitioners} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assistants.map((a) => (
          <div key={a.id} className="card">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color }} />
              <Link href={`/planning?user=${a.id}`} className="font-semibold text-ardoise-900 hover:text-faraday-700 hover:underline">
                {a.firstName} {a.lastName}
              </Link>
              {!a.active && <span className="badge bg-ardoise-100 text-ardoise-500">Inactif</span>}
            </div>
            <p className="mt-1 text-xs text-ardoise-500">{a.email}</p>
            {a.assistantProfile && (
              <p className="mt-2 text-sm text-ardoise-600">
                Contrat : {a.assistantProfile.contractType === "TEMPS_PLEIN" ? "Temps plein" : "Temps partiel"} —{" "}
                {a.assistantProfile.weeklyContractHours}h/semaine
              </p>
            )}
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ardoise-400">Praticiens assignés</p>
              {a.assignmentsAsAssistant.length === 0 ? (
                <p className="text-sm text-ardoise-400">Aucune assignation</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm text-ardoise-700">
                  {a.assignmentsAsAssistant.map((asg) => (
                    <li key={asg.id}>
                      {asg.practitioner.firstName} {asg.practitioner.lastName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
