import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";

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
          <svg viewBox="0 0 40 40" width="52" height="52" aria-hidden="true" className="mb-3">
            <rect width="40" height="40" rx="11" fill="#2f5041" />
            <circle cx="20" cy="20" r="10.5" fill="none" stroke="#f6f4ef" strokeWidth="2.6" />
            <line x1="20" y1="20" x2="20" y2="12.5" stroke="#f6f4ef" strokeWidth="2.6" strokeLinecap="round" />
            <line x1="20" y1="20" x2="25.5" y2="22.5" stroke="#f6f4ef" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          <h1 className="text-2xl font-semibold tracking-tight text-ardoise-900">Surmaly</h1>
          <p className="mt-1 text-sm text-ardoise-500">Cabinet Faraday — gestion des horaires</p>
        </div>
        <div className="card">
          <LoginForm redirectTo={redirect} />
        </div>
      </div>
    </main>
  );
}
