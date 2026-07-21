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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-faraday-600 text-lg font-semibold text-white">
            CF
          </div>
          <h1 className="text-xl font-semibold text-ardoise-900">FaradayBoard</h1>
          <p className="mt-1 text-sm text-ardoise-500">Active ton compte en choisissant ton mot de passe</p>
        </div>
        <div className="card">
          {token ? (
            <ActivateAccountForm token={token} />
          ) : (
            <p className="text-sm text-red-700">
              Lien d&apos;invitation manquant ou invalide. Demande à l&apos;administrateur de t&apos;en renvoyer un.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
