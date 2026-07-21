# FaradayBoard — Cabinet Faraday

Application interne de gestion des horaires, absences, congés, heures
supplémentaires et validations mensuelles pour le Cabinet Faraday.

**Ce n'est pas un produit SaaS.** FaradayBoard est conçu pour fonctionner en
local, sur l'ordinateur du cabinet ou sur le réseau interne, avec une base de
données SQLite locale. Aucun abonnement, aucun paiement, aucune dépendance à
un service externe.

## Stack technique

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS
- Server Actions Next.js comme backend (pas de serveur séparé)
- Prisma ORM + SQLite (fichier local `prisma/dev.db`)
- Authentification par session JWT (cookie httpOnly) + mots de passe hashés (bcrypt)
- Génération de PDF (pdfkit) et export CSV (Excel, encodage UTF-8, format français)
- PWA installable (manifest.json)

## Installation

Prérequis : Node.js 20+ et npm.

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

L'application est alors disponible sur http://localhost:3000.

## Mise en production (sur l'ordinateur du cabinet)

```bash
npm install
npx prisma migrate deploy
npm run build
npm start
```

Pour un accès depuis les autres postes du cabinet, ouvrir le port 3000 sur le
réseau local et accéder à `http://<ip-du-poste>:3000`.

## Comptes de démonstration (créés par `npm run db:seed`)

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@cabinet-faraday.fr | Admin123! |
| RH / Responsable | rh@cabinet-faraday.fr | Rh123456! |
| Comptable (lecture seule) | comptable@cabinet-faraday.fr | Compta123! |
| Praticien | dr.bernard@cabinet-faraday.fr | Praticien1! |
| Praticien | dr.lefevre@cabinet-faraday.fr | Praticien2! |
| Assistante (temps plein) | assistante1@cabinet-faraday.fr | Assistante1! |
| Assistante (temps partiel) | assistante2@cabinet-faraday.fr | Assistante2! |
| Assistante (temps plein) | assistante3@cabinet-faraday.fr | Assistante3! |

**Changez ces mots de passe dès la mise en production réelle.** Le seed est
un jeu de données de démonstration ; rien n'est codé en dur dans
l'application elle-même — tous les comptes, rôles, horaires types et règles
de calcul sont administrables depuis l'interface.

## Structure du projet

```
app/                      Pages Next.js (App Router)
  (protected)/             Pages nécessitant une session active
    dashboard/              Tableau de bord admin/RH
    mon-espace/             Espace personnel assistant(e)
    espace-praticien/       Espace personnel praticien
    mes-horaires/           Historique des horaires personnels
    planning/               Planning d'équipe + horaires types
    equipe/                 Gestion des utilisateurs, assistantes, praticiens
    absences/               Demandes et validation des absences/congés
    validations/            Validation quotidienne des heures
      mensuelles/            Workflow de validation mensuelle
    rapports/               Exports PDF / CSV
    parametres/             Paramètres du cabinet, règles de calcul, sauvegarde
    audit/                  Journal d'audit
  api/                     Routes API (exports PDF/CSV, sauvegarde/restauration)
  login/                   Page de connexion
components/                Composants partagés (Sidebar, TopBar, etc.)
lib/
  actions/                  Server Actions (logique métier par domaine)
  hours-engine.ts            Moteur de calcul des heures (pur, testé unitairement)
  auth.ts, permissions.ts    Authentification et RBAC
  audit.ts                   Journal d'audit + notifications
  pdf.ts, csv.ts              Génération des exports
prisma/
  schema.prisma              Schéma de la base de données
  seed.ts                     Données de démonstration
tests/                     Tests unitaires (Vitest)
types/                     Types partagés
```

## Rôles et permissions

- **ADMIN** : contrôle total (utilisateurs, règles de calcul, sauvegardes, audit).
- **RH / Responsable de cabinet** : planning, horaires, absences, validations, exports — sans accès aux réglages techniques sensibles.
- **PRATICIEN** : son propre planning, ses assistantes assignées, les absences de son équipe.
- **ASSISTANT(E)** : son planning, confirmation/modification du jour en cours uniquement (pas le passé), déclaration d'absences, validation du récapitulatif mensuel.
- **COMPTABLE** : lecture seule sur les récapitulatifs validés, PDF et CSV.

Les permissions par défaut sont définies par rôle (`lib/permissions.ts`) et
peuvent être surchargées individuellement par utilisateur via la table
`UserPermission` — rien n'est figé dans le code.

## Règles de calcul des heures

Configurables depuis `/parametres/regles` (administrateur uniquement) :

- Seuil hebdomadaire temps plein (35h par défaut)
- Heures supplémentaires : majoration de 25 % de la 36e à la 43e heure, 50 % au-delà
- Heures complémentaires (temps partiel) : majoration de 15 % jusqu'à 10 % du contrat, 25 % au-delà
- Les déficits (heures manquantes) et les ajustements manuels ne sont jamais majorés
- Arrondi des horaires configurable (exact, 5 min, 15 min)

Le moteur de calcul (`lib/hours-engine.ts`) est un module pur, testé
unitairement (`npm test`), totalement indépendant de la base de données.

## Création et gestion des utilisateurs

Depuis `/equipe` (ADMIN/RH) :
1. Cliquer sur "Créer l'utilisateur", renseigner nom/prénom/email/rôle.
2. Un mot de passe temporaire est généré et affiché une seule fois — à transmettre à l'utilisateur.
3. L'utilisateur doit changer son mot de passe à la première connexion.
4. Pour les assistant(e)s/praticiens, associer via `/equipe/assistants` ou `/equipe/praticiens`.

## Sauvegarde et restauration

Depuis `/parametres/sauvegarde` (ADMIN) :
- "Créer une sauvegarde maintenant" copie le fichier SQLite dans le dossier `backups/`.
- Chaque sauvegarde peut être téléchargée ou supprimée.
- La restauration accepte un fichier `.db` et remplace la base active (une copie de sécurité de l'état précédent est créée automatiquement avant tout remplacement).

## Génération des exports

Depuis `/rapports` :
- **PDF individuel** : récapitulatif mensuel d'un salarié (heures prévues, travaillées, absences, ajustements, heures sup., solde).
- **PDF global comptable** : synthèse de tous les salariés sur une période (ADMIN/RH/COMPTABLE).
- **CSV comptable** : export Excel (séparateur `;`, dates françaises, UTF-8 avec BOM).

## Journal d'audit

Toutes les actions sensibles (connexion, création/désactivation de compte,
correction d'horaires, validations, sauvegardes/restaurations, exports) sont
enregistrées dans `/audit` avec l'auteur, l'horodatage, l'action et les
valeurs avant/après.

## Tests

```bash
npm test
```

Couvre notamment : calcul journalier/hebdomadaire des heures, heures
supplémentaires temps plein (paliers 25 %/50 %), heures complémentaires
temps partiel (paliers 15 %/25 %), déficits non majorés, agrégation mensuelle
(mois normal, avec absence, temps partiel, ajustement négatif).

## Notes de sécurité

- Mots de passe hashés avec bcrypt (12 rounds).
- Sessions signées (JWT, cookie httpOnly, secure en production).
- Toute action sensible revérifie le rôle côté serveur (jamais de confiance
  dans les données envoyées par le client).
- Aucune donnée sensible n'est exposée côté frontend au-delà de ce qui est strictement nécessaire à l'affichage.
