import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; roles: Role[] };

// Navigation partagée entre le menu latéral (desktop) et le menu mobile.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", roles: ["ADMIN", "RH"] },
  { href: "/mon-espace", label: "Mon espace", roles: ["ASSISTANT"] },
  { href: "/pointage", label: "Pointer", roles: ["ASSISTANT"] },
  { href: "/mes-horaires", label: "Mes horaires", roles: ["ASSISTANT"] },
  { href: "/espace-praticien", label: "Mon équipe", roles: ["PRATICIEN"] },
  { href: "/planning", label: "Planning", roles: ["ADMIN", "RH", "PRATICIEN"] },
  { href: "/equipe", label: "Équipe", roles: ["ADMIN", "RH"] },
  { href: "/equipe/pointage", label: "Pointage QR", roles: ["ADMIN", "RH"] },
  { href: "/absences", label: "Absences", roles: ["ADMIN", "RH", "ASSISTANT", "PRATICIEN"] },
  { href: "/messages", label: "Messagerie", roles: ["ADMIN", "RH", "PRATICIEN", "ASSISTANT", "COMPTABLE"] },
  { href: "/validations", label: "Validations", roles: ["ADMIN", "RH", "ASSISTANT", "COMPTABLE"] },
  { href: "/rapports", label: "Rapports", roles: ["ADMIN", "RH", "COMPTABLE"] },
  { href: "/parametres", label: "Paramètres", roles: ["ADMIN", "RH"] },
  { href: "/audit", label: "Journal d'audit", roles: ["ADMIN"] },
  { href: "/aide", label: "Aide", roles: ["ADMIN", "RH", "PRATICIEN", "ASSISTANT", "COMPTABLE"] },
];
