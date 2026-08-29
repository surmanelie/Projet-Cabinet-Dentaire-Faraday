import { LogoMark } from "@/components/Logo";
import ActivateAccountForm from "./ActivateAccountForm";

export default async function ActiverComptePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ardoise-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LogoMark size={44} />
          </div>
          <h1 className="modal-title">Activation du compte</h1>
          <p className="mt-1.5 text-sm text-ardoise-500">Choisissez votre mot de passe pour continuer.</p>
        </div>
        <div className="card">
          {token ? (
            <ActivateAccountForm token={token} />
          ) : (
            <p className="text-sm text-red-800">
              Lien d&apos;invitation manquant ou invalide. Demande à l&apos;administrateur de t&apos;en renvoyer un.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
