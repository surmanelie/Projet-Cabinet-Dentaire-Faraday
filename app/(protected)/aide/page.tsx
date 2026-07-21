import { getSession } from "@/lib/auth";

const SECTIONS: { title: string; roles: string[]; items: { q: string; a: string }[] }[] = [
  {
    title: "Se connecter et activer son compte",
    roles: ["ADMIN", "RH", "PRATICIEN", "ASSISTANT", "COMPTABLE"],
    items: [
      {
        q: "J'ai reçu une invitation, comment je crée mon mot de passe ?",
        a: "Ouvre le lien reçu par email (ou transmis par l'administrateur). Choisis un mot de passe d'au moins 8 caractères, confirme-le, puis clique sur « Activer mon compte ». Tu pourras ensuite te connecter sur la page de connexion avec ton email et ce mot de passe.",
      },
      {
        q: "J'ai oublié mon mot de passe.",
        a: "Demande à l'administrateur de cliquer sur « Renvoyer l'invitation » depuis la page Équipe : tu recevras un nouveau lien pour choisir un nouveau mot de passe.",
      },
    ],
  },
  {
    title: "Pour les assistant(e)s",
    roles: ["ASSISTANT"],
    items: [
      {
        q: "Comment je déclare mes heures travaillées ?",
        a: "Va dans « Mon espace » ou « Mes horaires » pour saisir tes heures d'arrivée/départ et tes pauses, jour par jour.",
      },
      {
        q: "Comment je demande une absence ou des congés ?",
        a: "Va dans « Absences », crée une nouvelle demande en précisant le type (congé, maladie, RTT...) et les dates. Elle sera ensuite validée par l'administrateur ou le RH.",
      },
      {
        q: "Comment je vois si j'ai des heures en plus ou en moins ?",
        a: "Ton suivi d'heures (écart entre tes heures contractuelles et tes heures réelles) est visible par l'administrateur dans Équipe > Suivi des heures. Ton solde (manque ou excédent) y est calculé chaque mois.",
      },
      {
        q: "Qu'est-ce que la validation mensuelle ?",
        a: "Chaque mois, ton récapitulatif d'heures doit être validé (par toi puis par l'administrateur) dans la section « Validations ». Vérifie que tes heures et absences sont correctes avant de valider.",
      },
    ],
  },
  {
    title: "Pour les praticiens",
    roles: ["PRATICIEN"],
    items: [
      {
        q: "Comment je vois mon équipe d'assistantes ?",
        a: "Va dans « Mon équipe » (espace praticien) pour voir les assistantes qui te sont rattachées et leur planning.",
      },
      {
        q: "Comment je consulte le planning du cabinet ?",
        a: "Va dans « Planning » pour voir les horaires de toute l'équipe sur la semaine ou le mois.",
      },
    ],
  },
  {
    title: "Pour l'administrateur",
    roles: ["ADMIN"],
    items: [
      {
        q: "Comment je crée un compte pour une nouvelle personne ?",
        a: "Va dans « Équipe », renseigne prénom, nom, email et rôle, puis valide. Un email d'invitation est envoyé automatiquement (ou un lien à transmettre toi-même si l'envoi automatique n'est pas configuré) pour que la personne choisisse son propre mot de passe. Tu es le seul à pouvoir créer des comptes.",
      },
      {
        q: "Comment je suis le nombre d'heures de chaque employé ?",
        a: "Va dans « Équipe » > « Suivi des heures » : tu y vois, pour chaque personne et chaque mois, les heures travaillées, les heures contractuelles, et le solde (heures manquantes ou heures en plus/supplémentaires).",
      },
      {
        q: "Comment je désactive ou réinvite un compte ?",
        a: "Depuis la page Équipe, utilise les boutons « Activer/Désactiver » et « Renvoyer l'invitation » sur la ligne de la personne concernée.",
      },
    ],
  },
  {
    title: "Pour le RH / la comptabilité",
    roles: ["RH", "COMPTABLE"],
    items: [
      {
        q: "Quel est mon périmètre ?",
        a: "Le RH peut consulter et gérer les comptes, le planning, les absences et les rapports, mais ne peut pas créer de nouveaux comptes (réservé à l'administrateur). Le comptable a un accès en lecture aux rapports et validations.",
      },
      {
        q: "Comment j'exporte les données pour la paie ?",
        a: "Va dans « Rapports » pour générer des exports PDF ou CSV des heures et absences sur la période souhaitée.",
      },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "RH",
  PRATICIEN: "Praticien",
  ASSISTANT: "Assistant(e)",
  COMPTABLE: "Comptable",
};

export default async function AidePage() {
  const session = await getSession();
  const role = session?.role ?? "ASSISTANT";
  const sections = SECTIONS.filter((s) => s.roles.includes(role) || s.roles.length === 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ardoise-900">Aide & mode d&apos;emploi</h1>
        <p className="mt-1 text-sm text-ardoise-500">
          Guide adapté à ton rôle ({ROLE_LABELS[role] ?? role}) pour utiliser FaradayBoard.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="card">
            <h2 className="mb-3 text-sm font-semibold text-ardoise-900">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.q}>
                  <p className="text-sm font-medium text-ardoise-800">{item.q}</p>
                  <p className="mt-1 text-sm text-ardoise-500">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
