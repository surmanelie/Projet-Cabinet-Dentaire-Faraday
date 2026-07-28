import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import { logoutAction } from "@/lib/actions/auth";
import { LogoMark } from "@/components/Logo";

const NAV = [
  { href: "/platform-admin", label: "Tableau de bord" },
  { href: "/platform-admin/entreprises", label: "Entreprises" },
  { href: "/platform-admin/journal", label: "Journal d'audit" },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();

  return (
    <div className="flex min-h-screen bg-ardoise-900 text-ardoise-100">
      <aside className="hidden w-60 flex-col border-r border-white/10 p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <LogoMark size={30} />
          <div>
            <p className="text-sm font-semibold text-white">Surmaly</p>
            <p className="text-[11px] uppercase tracking-wide text-faraday-300">Back-office</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ardoise-200 transition hover:bg-white/10">
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction}>
          <button className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-ardoise-200 hover:bg-white/10">
            Déconnexion
          </button>
        </form>
      </aside>

      <div className="flex-1">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
            Espace propriétaire de la plateforme
          </span>
          <div className="ml-auto flex gap-3 text-sm md:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-ardoise-300 hover:text-white">{n.label}</Link>
            ))}
          </div>
        </header>
        <main className="p-4 md:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
