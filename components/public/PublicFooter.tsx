import { LogoMark } from "@/components/Logo";

export default function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ardoise-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center md:px-6">
        <div className="flex items-center gap-2">
          <LogoMark size={24} />
          <span className="font-semibold text-ardoise-900">Surmaly</span>
        </div>
        <p className="text-xs text-ardoise-400">© {year} Surmaly. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
