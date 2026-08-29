import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCabinetSettings } from "@/lib/rules";
import SectionLabel from "@/components/SectionLabel";
import SettingsForm from "./SettingsForm";
import Link from "next/link";

export default async function ParametresPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const settings = await getCabinetSettings();

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <SectionLabel>Paramètres</SectionLabel>
          <h1 className="mt-3 page-title">Paramètres du cabinet</h1>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/parametres/regles" className="text-faraday-700 hover:underline">Règles de calcul</Link>
          <Link href="/parametres/sauvegarde" className="text-faraday-700 hover:underline">Sauvegarde</Link>
        </div>
      </div>

      <div className="card">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
