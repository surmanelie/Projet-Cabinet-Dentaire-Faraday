import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ardoise-200 bg-creme-50/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-content items-center gap-4 px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="Surmaly">
          <LogoMark size={32} />
          <span className="font-semibold tracking-tight text-lg text-ardoise-900">Surmaly</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="btn-secondary">Connexion</Link>
        </div>
      </div>
    </header>
  );
}
