import { LogoMark } from "@/components/Logo";

export default function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ardoise-200">
      <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-6 py-16 text-center md:px-12">
        <LogoMark size={26} />
        <p className="text-[11px] uppercase tracking-wider2 text-ardoise-400">
          © {year} Surmaly — Cabinet Faraday
        </p>
      </div>
    </footer>
  );
}
