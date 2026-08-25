import Link from "next/link";
import LoginForm from "./LoginForm";
import { LogoMark } from "@/components/Logo";
import SectionLabel from "@/components/SectionLabel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      {/* Panneau éditorial — masqué sur mobile */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-faraday-700 px-12 py-16 text-creme-50 md:flex lg:px-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)",
          }}
          aria-hidden="true"
        />
        <SectionLabel tone="inverted">Espace privé</SectionLabel>
        <div>
          <p className="font-serif text-[clamp(2.5rem,4vw,4rem)] italic leading-[1.05] text-creme-50">
            La précision,
            <br />
            au quotidien.
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-creme-100/70">
            Planning, pointage et suivi des heures — un seul espace, pensé pour
            votre équipe.
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-wider2 text-creme-100/50">
          Surmaly — Cabinet Faraday
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center px-6 py-16 md:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center text-center md:hidden">
            <div className="mb-4">
              <LogoMark size={48} />
            </div>
            <h1 className="font-serif text-2xl italic text-ardoise-900">Surmaly</h1>
          </div>

          <h2 className="hidden font-serif text-3xl italic text-ardoise-900 md:block">
            Connexion
          </h2>
          <p className="mb-8 mt-2 hidden text-sm text-ardoise-500 md:block">
            Accédez à votre espace de gestion.
          </p>

          <LoginForm redirectTo={redirect} />

          <p className="mt-8 text-center text-xs text-ardoise-400">
            <Link href="/" className="transition-colors hover:text-faraday-700">
              ← Retour au site
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
