import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-faraday-500/20 text-faraday-300",
  PENDING: "bg-amber-500/20 text-amber-300",
  SUSPENDED: "bg-red-500/20 text-red-300",
  CANCELED: "bg-white/10 text-ardoise-300",
  PAST_DUE: "bg-red-500/20 text-red-300",
  EXPIRED: "bg-white/10 text-ardoise-300",
};

const FILTERS = [
  { key: "", label: "Toutes" },
  { key: "ACTIVE", label: "Actives" },
  { key: "PENDING", label: "En attente" },
  { key: "SUSPENDED", label: "Suspendues" },
  { key: "CANCELED", label: "Résiliées" },
  { key: "FREE", label: "Offertes" },
];

const PAGE_SIZE = 20;

export default async function EntreprisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string; p?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const f = sp.f ?? "";
  const page = Math.max(1, Number(sp.p) || 1);

  const where: Prisma.CompanyWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { pendingAdminEmail: { contains: q, mode: "insensitive" } },
      { stripeCustomerId: { contains: q, mode: "insensitive" } },
      { users: { some: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (f === "FREE") where.accessType = "FREE";
  else if (f) where.status = f;

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, name: true, status: true, accessType: true, offerId: true, createdAt: true,
        pendingAdminEmail: true,
        _count: { select: { users: true } },
        users: { where: { role: "ADMIN" }, select: { email: true, firstName: true, lastName: true }, take: 1 },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (f) p.set("f", f);
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    return `?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Entreprises <span className="text-ardoise-400">({total})</span></h1>
        <Link href="/platform-admin/entreprises/nouvelle" className="rounded-xl bg-faraday-500 px-4 py-2 text-sm font-medium text-white hover:bg-faraday-600">
          + Créer (gratuite)
        </Link>
      </div>

      <form method="GET" className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Rechercher (nom, e-mail, ID client…)" className="w-full max-w-md rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-ardoise-500 focus:border-faraday-400 focus:outline-none" />
        {f && <input type="hidden" name="f" value={f} />}
        <button className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">Rechercher</button>
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((flt) => (
          <Link key={flt.key} href={qs2(q, flt.key)} className={`rounded-full px-3 py-1 text-xs ${f === flt.key ? "bg-faraday-500 text-white" : "border border-white/15 text-ardoise-300 hover:bg-white/10"}`}>
            {flt.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-ardoise-400">
              <th className="p-3">Entreprise</th>
              <th className="p-3">Responsable</th>
              <th className="p-3">Utilisateurs</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Type</th>
              <th className="p-3">Inscription</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="p-3">
                  <Link href={`/platform-admin/entreprises/${c.id}`} className="font-medium text-white hover:underline">{c.name}</Link>
                </td>
                <td className="p-3 text-ardoise-300">{c.users[0] ? `${c.users[0].firstName} ${c.users[0].lastName}` : (c.pendingAdminEmail ?? "—")}</td>
                <td className="p-3 text-ardoise-300">{c._count.users}</td>
                <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs ${STATUS_TONE[c.status] ?? "bg-white/10 text-ardoise-300"}`}>{c.status}</span></td>
                <td className="p-3 text-ardoise-300">{c.accessType === "FREE" ? "Offert" : "Payant"}</td>
                <td className="p-3 text-ardoise-400">{c.createdAt.toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-ardoise-400">Aucune entreprise.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-ardoise-300">
          {page > 1 && <Link href={qs({ p: page - 1 })} className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10">← Précédent</Link>}
          <span>Page {page} / {pages}</span>
          {page < pages && <Link href={qs({ p: page + 1 })} className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10">Suivant →</Link>}
        </div>
      )}
    </div>
  );
}

function qs2(q: string, f: string) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (f) p.set("f", f);
  return `?${p.toString()}`;
}
