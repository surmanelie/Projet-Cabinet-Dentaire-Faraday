import { logoutAction } from "@/lib/actions/auth";

export default function CompteSuspenduPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ardoise-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-ardoise-900">Accès suspendu</h1>
        <p className="mt-3 text-sm text-ardoise-600">
          L&apos;accès de votre entreprise est actuellement suspendu ou l&apos;abonnement est arrivé à échéance.
          Vos données sont conservées. Pour réactiver l&apos;accès, contactez l&apos;administrateur de la plateforme
          ou régularisez votre abonnement.
        </p>
        <a href="mailto:contact@surmaly.fr" className="btn-primary mt-6 inline-flex">Contacter le support</a>
        <form action={logoutAction} className="mt-3">
          <button className="text-sm text-ardoise-500 hover:underline">Se déconnecter</button>
        </form>
      </div>
    </main>
  );
}
