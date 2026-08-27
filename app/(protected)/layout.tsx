import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import { getUnreadNotifications } from "@/lib/actions/notifications";
import type { SessionUser } from "@/types";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Le JWT de session est signé au moment de la connexion et n'est pas
  // revérifié par le middleware à chaque requête (rapide, mais peut devenir
  // obsolète). On revalide ici le rôle et le statut actif en base à chaque
  // navigation dans l'espace protégé : si le compte a été désactivé ou son
  // rôle changé depuis la connexion, on bloque immédiatement l'accès plutôt
  // que de continuer à autoriser d'anciens droits jusqu'à expiration du
  // cookie (jusqu'à 30 jours avec "rester connecté"). Le cookie lui-même ne
  // peut être effacé que depuis une Server Action / Route Handler, pas ici :
  // il sera simplement remplacé à la prochaine connexion réussie.
  const fresh = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      color: true,
      active: true,
      mustChangePassword: true,
    },
  });
  if (!fresh || !fresh.active || fresh.role !== session.role) {
    redirect("/login");
  }
  // Mot de passe initial défini par l'admin : bloque tout accès à l'espace
  // protégé tant que la personne ne l'a pas personnalisé.
  if (fresh.mustChangePassword) {
    redirect("/changer-mot-de-passe");
  }
  const currentUser: SessionUser = fresh;

  const notifications = await getUnreadNotifications();

  return (
    <div className="min-h-screen bg-ardoise-50">
      <TopBar user={currentUser} notifications={notifications} />
      <main className="px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
