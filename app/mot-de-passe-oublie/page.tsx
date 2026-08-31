import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import ForgotPasswordForm from "./ForgotPasswordForm";

/**
 * Page publique (avant connexion) : l'assistante indique son email, ce qui
 * prévient les administrateurs qu'elle a besoin d'un nouveau mot de passe.
 * Pas de réinitialisation automatique — l'admin crée le nouveau mot de
 * passe depuis Équipe → Modifier et le lui transmet.
 */
export default function MotDePasseOubliePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ardoise-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LogoMark size={44} />
          </div>
          <h1 className="modal-title">Mot de passe oublié</h1>
          <p className="mt-1.5 text-sm text-ardoise-500">
            Indiquez votre email : l&apos;administrateur sera prévenu et vous transmettra un nouveau mot de passe.
          </p>
        </div>
        <div className="card">
          <ForgotPasswordForm />
        </div>
        <p className="mt-8 text-center text-xs text-ardoise-400">
          <Link href="/login" className="transition-colors hover:text-faraday-700">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
