import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCabinetSettings } from "@/lib/rules";
import SettingsForm from "./SettingsForm";
import Link from "next/link";

export default async function ParametresPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const settings = await getCabinetSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ardoise-900">Paramètres du cabinet</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/parametres/regles" className="text-faraday-600 hover:underline">Règles de calcul</Link>
          <Link href="/parametres/sauvegarde" className="text-faraday-600 hover:underline">Sauvegarde</Link>
        </div>
      </div>

      <div className="card">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
