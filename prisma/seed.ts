/**
 * Initialisation minimale de FaradayBoard.
 *
 * Conformément à la V1 souhaitée, ce script crée UNIQUEMENT :
 *   - 1 compte administrateur
 *   - 1 compte assistante « exemple »
 *
 * Rien n'est codé en dur dans l'application : ces comptes sont de vraies
 * données en base, que l'administrateur peut ensuite modifier, désactiver
 * ou supprimer depuis /equipe. L'assistante exemple a un horaire type
 * (lundi→vendredi) pour illustrer le suivi des heures.
 *
 * Le script est idempotent (upsert par email) : il peut être relancé sans
 * dupliquer ni écraser des comptes réels déjà créés.
 *
 * Lancer avec : npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_RULES = {
  fullTimeWeeklyThreshold: 35,
  overtimeTier1UpToHours: 43,
  overtimeTier1Rate: 0.25,
  overtimeTier2Rate: 0.5,
  partTimeComplementaryTier1Pct: 0.1,
  partTimeComplementaryTier1Rate: 0.15,
  partTimeComplementaryTier2Rate: 0.25,
  rounding: "EXACT",
};

// Identifiants de la V1 — à changer après la première connexion.
const ADMIN_EMAIL = "admin@cabinet-faraday.fr";
const ADMIN_PASSWORD = "Admin1234!";
const ASSISTANT_EMAIL = "assistante@cabinet-faraday.fr";
const ASSISTANT_PASSWORD = "Assistante1234!";
const ASSISTANT_CLOCK_PIN = "1234"; // code de pointage (modifiable depuis /equipe)

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  console.log("Seed minimal : démarrage…");

  await prisma.cabinetSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Cabinet Faraday",
      address: "12 rue de la Santé, 75013 Paris",
      timezone: "Europe/Paris",
      rulesConfigJson: JSON.stringify(DEFAULT_RULES),
    },
  });

  // 1) Administrateur
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      firstName: "Camille",
      lastName: "Faraday",
      email: ADMIN_EMAIL,
      passwordHash: await hash(ADMIN_PASSWORD),
      role: "ADMIN",
      color: "#0f6157",
      mustChangePassword: false,
    },
  });

  // 2) Assistante exemple (vraie donnée, modifiable/supprimable depuis /equipe)
  const assistant = await prisma.user.upsert({
    where: { email: ASSISTANT_EMAIL },
    update: {},
    create: {
      firstName: "Léa",
      lastName: "Exemple",
      email: ASSISTANT_EMAIL,
      passwordHash: await hash(ASSISTANT_PASSWORD),
      role: "ASSISTANT",
      color: "#ec4899",
      mustChangePassword: false,
      clockPinHash: await hash(ASSISTANT_CLOCK_PIN),
      assistantProfile: {
        create: {
          contractType: "TEMPS_PLEIN",
          weeklyContractHours: 35,
          notes: "Compte exemple — modifiable ou supprimable depuis l'espace Équipe.",
        },
      },
    },
  });

  // Horaire type de l'assistante exemple : lundi(1) → vendredi(5)
  for (const day of [1, 2, 3, 4, 5]) {
    await prisma.scheduleTemplate.upsert({
      where: { id: `seed-${assistant.id}-${day}` },
      update: {},
      create: {
        id: `seed-${assistant.id}-${day}`,
        userId: assistant.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        breakStart: "12:30",
        breakEnd: "13:30",
      },
    });
  }

  console.log("\nSeed terminé. Comptes de la V1 :");
  console.log(`  Administrateur : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Assistante     : ${ASSISTANT_EMAIL} / ${ASSISTANT_PASSWORD}`);
  console.log(`  Code pointage assistante : ${ASSISTANT_CLOCK_PIN}`);
  console.log("\n(Modifiez ces comptes ou ajoutez-en d'autres depuis /equipe.)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
