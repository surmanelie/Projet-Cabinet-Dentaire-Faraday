import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SectionLabel from "@/components/SectionLabel";
import BackupActions from "./BackupActions";

export default async function SauvegardePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <SectionLabel>Paramètres</SectionLabel>
        <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Sauvegarde &amp; restauration</h1>
        <p className="mt-2 text-sm text-ardoise-500">
          Exportez l&apos;intégralité des données du cabinet dans un fichier JSON téléchargé sur votre appareil,
          ou restaurez-les à partir d&apos;une sauvegarde précédente. La restauration remplace toutes les
          données actuelles — une copie de sécurité de l&apos;état présent est automatiquement téléchargée
          avant tout remplacement.
        </p>
      </div>

      <div className="card">
        <BackupActions />
      </div>
    </div>
  );
}
