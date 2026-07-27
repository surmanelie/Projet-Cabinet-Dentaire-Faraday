import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/mon-espace",
        "/mes-horaires",
        "/equipe",
        "/planning",
        "/absences",
        "/messages",
        "/validations",
        "/rapports",
        "/parametres",
        "/audit",
        "/espace-praticien",
        "/pointage",
        "/inscription",
        "/api/",
      ],
    },
  };
}
