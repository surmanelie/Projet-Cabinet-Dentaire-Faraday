import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; roles: Role[] };

// Navigation volontairement courte : deux univers, l'administrateur (gestion)
// et l'employé (son espace). Pas de pages superflues.
export const NAV_ITEMS: NavItem[] = [
  // Administrateur / gestion
  { href: "/dashboard", label: "Tableau de bord", roles: ["ADMIN", "RH"] },
  { href: "/equipe", label: "Employés", roles: ["ADMIN", "RH"] },
  { href: "/planning", label: "Planning", roles: ["ADMIN", "RH"] },
  { href: "/equipe/pointage", label: "Pointage QR", roles: ["ADMIN", "RH"] },
  { href: "/absences", label: "Congés", roles: ["ADMIN", "RH"] },
  { href: "/rapports", label: "Rapports", roles: ["ADMIN", "RH", "COMPTABLE"] },
  { href: "/validations", label: "Validations", roles: ["ADMIN", "RH", "COMPTABLE"] },
  { href: "/parametres", label: "Paramètres", roles: ["ADMIN", "RH"] },

  // Employé (assistant / praticien)
  { href: "/mon-espace", label: "Mon espace", roles: ["ASSISTANT"] },
  { href: "/pointage", label: "Pointer", roles: ["ASSISTANT"] },
  { href: "/mes-horaires", label: "Mon agenda", roles: ["ASSISTANT"] },
  { href: "/absences", label: "Mes congés", roles: ["ASSISTANT", "PRATICIEN"] },
  { href: "/espace-praticien", label: "Mon équipe", roles: ["PRATICIEN"] },
  { href: "/planning", label: "Planning", roles: ["PRATICIEN"] },

  // Commun
  { href: "/messages", label: "Messagerie", roles: ["ADMIN", "RH", "PRATICIEN", "ASSISTANT", "COMPTABLE"] },
  { href: "/aide", label: "Aide", roles: ["ADMIN", "RH", "PRATICIEN", "ASSISTANT", "COMPTABLE"] },
];
