import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { SITE } from "@/lib/site-content";

export default function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ardoise-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <LogoMark size={28} />
              <span className="font-semibold text-ardoise-900">{SITE.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ardoise-500">{SITE.baseline}</p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ardoise-400">Produit</p>
            <ul className="space-y-2 text-sm text-ardoise-600">
              <li><Link href="/fonctionnement" className="hover:text-faraday-700">Fonctionnement</Link></li>
              <li><Link href="/offres" className="hover:text-faraday-700">Nos offres</Link></li>
              <li><Link href="/login" className="hover:text-faraday-700">Connexion</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ardoise-400">Société</p>
            <ul className="space-y-2 text-sm text-ardoise-600">
              <li><Link href="/qui-sommes-nous" className="hover:text-faraday-700">Qui sommes-nous ?</Link></li>
              <li><Link href="/contact" className="hover:text-faraday-700">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ardoise-400">Légal</p>
            <ul className="space-y-2 text-sm text-ardoise-600">
              <li><Link href="/conditions-generales" className="hover:text-faraday-700">Conditions générales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-faraday-700">Confidentialité</Link></li>
              <li><Link href="/mentions-legales" className="hover:text-faraday-700">Mentions légales</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-ardoise-100 pt-6 text-xs text-ardoise-400">
          © {year} {SITE.name}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
