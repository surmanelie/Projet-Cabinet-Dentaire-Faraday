import { prisma } from "@/lib/prisma";

export default async function PraticiensPage() {
  const practitioners = await prisma.user.findMany({
    where: { role: "PRATICIEN" },
    include: {
      practitionerProfile: true,
      assignmentsAsPractitioner: {
        where: { active: true },
        include: { assistant: true },
      },
    },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ardoise-900">Praticiens</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {practitioners.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <h3 className="font-semibold text-ardoise-900">
                {p.firstName} {p.lastName}
              </h3>
              {!p.active && <span className="badge bg-ardoise-100 text-ardoise-500">Inactif</span>}
            </div>
            <p className="mt-1 text-xs text-ardoise-500">{p.email}</p>
            {p.practitionerProfile && (
              <p className="mt-2 text-sm text-ardoise-600">
                {p.practitionerProfile.specialty || "Spécialité non renseignée"}
                {p.practitionerProfile.room ? ` — Salle ${p.practitionerProfile.room}` : ""}
              </p>
            )}
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ardoise-400">Assistantes assignées</p>
              {p.assignmentsAsPractitioner.length === 0 ? (
                <p className="text-sm text-ardoise-400">Aucune assistante assignée</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm text-ardoise-700">
                  {p.assignmentsAsPractitioner.map((asg) => (
                    <li key={asg.id}>
                      {asg.assistant.firstName} {asg.assistant.lastName}
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
