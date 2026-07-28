/**
 * Rapport d'isolation multi-entreprise (lecture seule, ne modifie rien).
 * Aide à repérer les comptes à vérifier manuellement.
 *
 *   npm run tenant:report
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, name: true, status: true } });
  const companyName = new Map(companies.map((c) => [c.id, c.name]));

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, companyId: true, active: true },
    orderBy: [{ companyId: "asc" }, { role: "asc" }],
  });

  const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN");
  const noCompany = users.filter((u) => u.companyId === null && u.role !== "SUPER_ADMIN");
  const withCompany = users.filter((u) => u.companyId !== null);

  console.log("=== RAPPORT ISOLATION MULTI-ENTREPRISE ===\n");
  console.log(`Entreprises : ${companies.length}`);
  console.log(`Utilisateurs total : ${users.length}`);
  console.log(`  · Super-admins plateforme : ${superAdmins.length} ${superAdmins.map((u) => u.email).join(", ")}`);
  console.log(`  · Rattachés à une entreprise : ${withCompany.length}`);
  console.log(`  · SANS entreprise (companyId null) : ${noCompany.length}`);

  if (noCompany.length) {
    console.log("\n⚠ Comptes SANS entreprise (= cabinet historique). À vérifier manuellement :");
    for (const u of noCompany) console.log(`   - ${u.email} (${u.role})`);
    console.log("   → Ces comptes forment le tenant « historique » (companyId null). Aucune réattribution automatique n'est faite.");
  }

  // Entreprises sans administrateur actif
  for (const c of companies) {
    const admins = users.filter((u) => u.companyId === c.id && u.role === "ADMIN" && u.active);
    if (admins.length === 0) {
      console.log(`\n⚠ Entreprise « ${c.name} » (${c.id}) : aucun administrateur actif.`);
    }
  }

  // Regroupement par entreprise
  console.log("\n=== Membres par entreprise ===");
  const byCompany = new Map<string, number>();
  for (const u of withCompany) byCompany.set(u.companyId!, (byCompany.get(u.companyId!) ?? 0) + 1);
  for (const [cid, n] of byCompany) console.log(`   ${companyName.get(cid) ?? cid} : ${n} membre(s)`);

  console.log("\n(Rapport terminé — aucune donnée modifiée.)");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
