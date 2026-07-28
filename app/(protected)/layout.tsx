import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import { getUnreadNotifications } from "@/lib/actions/notifications";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Le propriétaire de la plateforme n'utilise pas l'app cliente.
  if (session.role === "SUPER_ADMIN") redirect("/platform-admin");

  // Blocage d'accès si l'entreprise (tenant) est suspendue / expirée. Les
  // comptes historiques (companyId null) ne sont pas concernés.
  const me = await prisma.user.findUnique({
    where: { id: session.id },
    select: { company: { select: { status: true, accessType: true, freeUntil: true } } },
  });
  const c = me?.company;
  if (c) {
    const freeExpired = c.accessType === "FREE" && c.freeUntil && c.freeUntil < new Date();
    if (["SUSPENDED", "CANCELED", "EXPIRED"].includes(c.status) || freeExpired) {
      redirect("/compte-suspendu");
    }
  }

  const notifications = await getUnreadNotifications();

  return (
    <div className="min-h-screen bg-ardoise-50">
      <TopBar user={session} notifications={notifications} />
      <main className="p-4 md:p-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
