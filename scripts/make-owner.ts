/**
 * Crée ou promeut le compte PROPRIÉTAIRE de la plateforme (SUPER_ADMIN).
 * Ce rôle ne peut JAMAIS être obtenu via l'inscription client — uniquement ici.
 *
 * Utilisation :
 *   npm run make:owner -- email@exemple.com "MotDePasse123"
 *   (si l'utilisateur existe déjà, le mot de passe est optionnel : il est
 *    simplement promu SUPER_ADMIN)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  const password = process.argv[3] ?? "";
  if (!email) {
    console.error("Usage : npm run make:owner -- email@exemple.com \"MotDePasse123\"");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "SUPER_ADMIN", active: true, companyId: null },
    });
    console.log(`✔ ${email} est maintenant PROPRIÉTAIRE de la plateforme (SUPER_ADMIN).`);
  } else {
    if (password.length < 8) {
      console.error("Pour créer un nouveau propriétaire, fournissez un mot de passe (min. 8 caractères).");
      process.exit(1);
    }
    await prisma.user.create({
      data: {
        firstName: "Propriétaire",
        lastName: "Plateforme",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "SUPER_ADMIN",
        active: true,
      },
    });
    console.log(`✔ Compte propriétaire créé : ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
