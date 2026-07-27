/**
 * Contenu de la vitrine publique — centralisé et facilement modifiable.
 * Ne pas éparpiller les textes importants ailleurs : tout se règle ici.
 */

export const SITE = {
  name: "Surmaly",
  baseline: "La gestion du temps de vos équipes, simplifiée.",
  hero: {
    title: "Le temps de vos équipes, enfin sous contrôle.",
    subtitle:
      "Pointage par QR code, agendas, congés et suivi des heures — un espace privé et sécurisé pour votre entreprise.",
  },
  valueProps: [
    { title: "Pointage sans friction", text: "Vos employés pointent en scannant un QR code et un code personnel." },
    { title: "Heures calculées automatiquement", text: "Journées, pauses, heures supplémentaires et manquantes, sans ressaisie." },
    { title: "Un espace privé par entreprise", text: "Chaque société dispose de son environnement sécurisé et isolé." },
  ],
  contact: {
    email: "contact@surmaly.fr",
    phone: "",
    address: "",
  },
  // Textes temporaires « Qui sommes-nous » — à remplacer par vos vrais textes.
  about: {
    story:
      "[À compléter] Surmaly est né du besoin de simplifier la gestion du temps de travail dans les cabinets et petites structures.",
    mission:
      "[À compléter] Offrir aux entreprises un outil clair et fiable pour suivre les heures de leurs équipes, sans complexité.",
    values: ["Simplicité", "Fiabilité", "Respect des données"],
    vision:
      "[À compléter] Devenir la solution de référence pour la gestion du temps des équipes de proximité.",
  },
};

export type Offer = {
  id: string;
  name: string;
  priceCents: number;
  currency: "EUR";
  period: "mois";
  tagline: string;
  features: string[];
  maxUsers: number | null;
  support: string;
  active: boolean;
  highlighted?: boolean;
};

/**
 * Offres d'abonnement. Structure évolutive : ajouter une entrée suffit à
 * créer une nouvelle formule partout dans la vitrine. L'identifiant de prix
 * Stripe sera relié côté serveur (variables d'environnement) en phase paiement.
 */
export const OFFERS: Offer[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    priceCents: 3000,
    currency: "EUR",
    period: "mois",
    tagline: "Tout le nécessaire pour gérer le temps de votre équipe.",
    features: [
      "Environnement privé pour votre entreprise",
      "Pointage par QR code et code personnel",
      "Agendas et plannings des employés",
      "Suivi des heures (jour, semaine, mois)",
      "Heures supplémentaires et manquantes",
      "Gestion des congés",
      "Messagerie interne",
      "Renouvellement automatique chaque mois",
      "Résiliation possible à tout moment",
    ],
    maxUsers: null,
    support: "Support par e-mail inclus",
    active: true,
    highlighted: true,
  },
];

export function getOffer(id: string): Offer | undefined {
  return OFFERS.find((o) => o.id === id && o.active);
}

/** Formate un montant en centimes vers l'euro à la française : « 30,00 € ». */
export function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export const STEPS = [
  { n: 1, title: "Choisissez votre offre", text: "Comparez les formules et sélectionnez celle qui correspond à vos besoins." },
  { n: 2, title: "Créez votre compte", text: "Renseignez les informations de votre entreprise et choisissez vos identifiants." },
  { n: 3, title: "Activez votre abonnement", text: "Réglez votre abonnement mensuel par paiement sécurisé." },
  { n: 4, title: "Accédez à votre environnement", text: "Un espace privé est créé automatiquement pour votre entreprise." },
  { n: 5, title: "Gérez votre activité", text: "Ajoutez vos employés, imprimez le QR code et suivez les heures en temps réel." },
];
