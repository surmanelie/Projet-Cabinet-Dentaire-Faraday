import { prisma } from "@/lib/prisma";
import { DEFAULT_RULES, type RulesConfig } from "@/lib/hours-engine";

/**
 * Charge la configuration des règles de calcul des heures depuis CabinetSettings.
 * Rien n'est codé en dur : toute valeur métier passe par cette fonction et la base.
 */
export async function getRulesConfig(): Promise<RulesConfig> {
  const settings = await getCabinetSettings();
  try {
    return { ...DEFAULT_RULES, ...JSON.parse(settings.rulesConfigJson) };
  } catch {
    return DEFAULT_RULES;
  }
}

export async function getCabinetSettings() {
  let settings = await prisma.cabinetSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.cabinetSettings.create({
      data: {
        id: "default",
        name: "Cabinet Faraday",
        rulesConfigJson: JSON.stringify(DEFAULT_RULES),
      },
    });
  }
  return settings;
}
