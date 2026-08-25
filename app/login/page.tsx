import LoginForm from "./LoginForm";
import { LogoMark } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ardoise-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3">
            <LogoMark size={54} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ardoise-900">Surmaly</h1>
          <p className="mt-1 text-sm text-ardoise-500">Gestion des horaires</p>
        </div>
        <div className="card">
          <LoginForm redirectTo={redirect} />
        </div>
        <p className="mt-4 text-center text-xs text-ardoise-400">
          <a href="/" className="hover:underline">← Retour au site</a>
        </p>
      </div>
    </main>
  );
}
