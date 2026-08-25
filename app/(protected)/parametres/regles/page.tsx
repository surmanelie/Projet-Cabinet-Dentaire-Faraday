import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRulesConfig } from "@/lib/rules";
import SectionLabel from "@/components/SectionLabel";
import RulesForm from "./RulesForm";

export default async function ReglesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const rules = await getRulesConfig();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <SectionLabel>Paramètres</SectionLabel>
        <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Règles de calcul des heures</h1>
        <p className="mt-2 text-sm text-ardoise-500">
          Ces règles pilotent entièrement le moteur de calcul (heures supplémentaires, heures complémentaires,
          arrondis). Aucune valeur n'est figée dans le code de l'application.
        </p>
      </div>
      <div className="card">
        <RulesForm rules={rules} />
      </div>
    </div>
  );
}
