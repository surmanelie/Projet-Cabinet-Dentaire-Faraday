import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ardoise-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-faraday-600 text-lg font-semibold text-white">
            CF
          </div>
          <h1 className="text-xl font-semibold text-ardoise-900">FaradayBoard</h1>
          <p className="mt-1 text-sm text-ardoise-500">Cabinet Faraday — gestion interne des horaires</p>
        </div>
        <div className="card">
          <LoginForm redirectTo={redirect} />
        </div>
      </div>
    </main>
  );
}
