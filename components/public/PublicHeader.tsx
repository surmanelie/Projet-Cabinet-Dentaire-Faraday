import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ardoise-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Surmaly">
          <LogoMark size={34} />
          <span className="text-lg font-semibold tracking-tight text-ardoise-900">Surmaly</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="btn-primary">Connexion</Link>
        </div>
      </div>
    </header>
  );
}
