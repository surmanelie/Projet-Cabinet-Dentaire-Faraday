import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import ChangePasswordForm from "./ChangePasswordForm";

/**
 * Étape obligatoire après une première connexion avec le mot de passe
 * initial défini par l'admin (User.mustChangePassword). Nécessite juste une
 * session valide, quel que soit le rôle.
 */
export default async function ChangerMotDePassePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ardoise-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LogoMark size={44} />
          </div>
          <h1 className="font-serif text-2xl italic text-ardoise-900">Choisissez votre mot de passe</h1>
          <p className="mt-1.5 text-sm text-ardoise-500">
            Pour votre sécurité, personnalisez le mot de passe initial avant de continuer.
          </p>
        </div>
        <div className="card">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
