# Prompt de contexte — FaradayBoard pour Claude Code

Tu reprends un projet Next.js existant appelé **FaradayBoard**, une application de gestion interne pour un cabinet dentaire. Le projet est fonctionnel et tourne en local. Lis ce document entièrement avant de toucher quoi que ce soit.

---

## 1. Stack technique

| Élément | Valeur |
|---|---|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| Langage | TypeScript strict |
| Base de données | SQLite via **Prisma 7** |
| Auth | JWT maison (jose) + bcryptjs, cookie httpOnly |
| CSS | Tailwind CSS avec classes custom (card, btn-primary, input, badge, label) |
| Email | nodemailer (désactivé tant que SMTP non configuré) |
| Runtime | Node.js, Windows 11, OneDrive sync |

---

## 2. Localisation du projet

```
C:\Users\surma\OneDrive\Desktop\Projets_perso\FaradayBoard\
```

Le dossier est synchronisé par OneDrive. La base de données SQLite est à :
```
prisma/dev.db
```

---

## 3. Structure des dossiers importants

```
FaradayBoard/
├── app/
│   ├── (protected)/          ← toutes les pages authentifiées
│   │   ├── layout.tsx        ← layout global (Sidebar + TopBar)
│   │   ├── dashboard/        ← tableau de bord ADMIN/RH
│   │   ├── mon-espace/       ← espace personnel ASSISTANT
│   │   ├── mes-horaires/     ← historique horaires ASSISTANT
│   │   ├── pointage/         ← *** NOUVEAU *** pages QR code
│   │   │   ├── page.tsx      ← hub pointage (liste des actions)
│   │   │   └── [action]/     ← page scan mobile (debut/pause-debut/pause-fin/fin)
│   │   │       ├── page.tsx
│   │   │       └── ClockButton.tsx (client component)
│   │   ├── equipe/           ← gestion équipe ADMIN/RH
│   │   │   ├── page.tsx
│   │   │   ├── assistants/   ← liste + création assistantes
│   │   │   ├── praticiens/
│   │   │   ├── heures/       ← dashboard heures par employé
│   │   │   └── pointage/     ← *** NOUVEAU *** QR codes + suivi live
│   │   │       ├── page.tsx  ← page principale admin pointage
│   │   │       ├── QrCodes.tsx (client component — génère QR via quickchart.io)
│   │   │       └── AdminClockEdit.tsx (client — correction/ajout pointage)
│   │   ├── planning/         ← templates horaires
│   │   ├── absences/
│   │   ├── validations/      ← validations mensuelles
│   │   ├── rapports/         ← exports PDF/CSV
│   │   ├── parametres/       ← settings cabinet + règles
│   │   ├── audit/            ← journal d'audit
│   │   └── aide/             ← page d'aide utilisateur
│   ├── login/                ← page connexion (publique)
│   │   ├── page.tsx          ← reçoit searchParams.redirect
│   │   └── LoginForm.tsx     ← passe redirectTo en champ caché
│   └── activer-compte/       ← activation via token d'invitation
├── components/
│   ├── Sidebar.tsx           ← navigation latérale filtrée par rôle
│   ├── TopBar.tsx            ← barre du haut (user + notifications)
│   ├── NotificationBell.tsx
│   └── StatCard.tsx
├── lib/
│   ├── auth.ts               ← getSession, createSession, hashPassword
│   ├── audit.ts              ← writeAuditLog (wrappé try/catch — ne crash jamais)
│   ├── permissions.ts        ← ROUTE_ACCESS, canAccessRoute, defaultRouteForRole
│   ├── prisma.ts             ← singleton Prisma client
│   ├── rules.ts              ← getCabinetSettings
│   ├── pdf.ts                ← génération PDF
│   ├── email.ts              ← sendInviteEmail (désactivé sans SMTP)
│   └── actions/              ← Server Actions Next.js
│       ├── auth.ts           ← loginAction, logoutAction, activateAccountAction
│       ├── users.ts          ← createUserAction, toggleActiveAction, resetPasswordAction
│       ├── clock.ts          ← *** NOUVEAU *** recordClockAction, editClockEntryAction, addClockEntryAction, getClockStatus, getTodayClockEntries, getAllTodayClockEntries, recordClockFromFormAction
│       ├── work-entries.ts   ← gestion WorkEntry (horaires journaliers)
│       ├── monthly-validation.ts
│       ├── notifications.ts
│       └── backup.ts
├── prisma/
│   ├── schema.prisma         ← schéma complet (voir section 4)
│   ├── dev.db                ← base SQLite (NE PAS COMMITTER)
│   ├── seed.ts               ← données de démo
│   └── migrations/           ← migrations appliquées
├── middleware.ts             ← protection routes + redirect login avec ?redirect=
├── types/index.ts            ← SessionUser, PermissionKey, etc.
└── tailwind.config.ts        ← couleurs custom : faraday-*, ardoise-*
```

---

## 4. Modèles Prisma (résumé)

### Enums existants
- `Role` : ADMIN | RH | PRATICIEN | ASSISTANT | COMPTABLE
- `ContractType` : TEMPS_PLEIN | TEMPS_PARTIEL | AUTRE
- `WorkEntryStatus` : PRE_REMPLI | CONFIRME | MODIFIE | A_VALIDER | VALIDE | REFUSE | CORRIGE | VERROUILLE
- `AbsenceType`, `AbsenceStatus`, `AdjustmentType`, `MonthlyValidationStatus`, `ReportType`
- `ClockAction` *(nouveau)* : DEBUT_JOURNEE | DEBUT_PAUSE | FIN_PAUSE | FIN_JOURNEE

### Modèles principaux
| Modèle | Description |
|---|---|
| `User` | Compte utilisateur (tous rôles). Champs : id, firstName, lastName, email, passwordHash, role, active, color, mustChangePassword, inviteToken, inviteTokenExpiresAt, invitedById |
| `AssistantProfile` | Profil contrat assistante (contractType, weeklyContractHours) |
| `PractitionerProfile` | Profil praticien (specialty, room) |
| `ScheduleTemplate` | Horaire type par jour de semaine (startTime, endTime, breakStart, breakEnd) |
| `WorkEntry` | Horaire journalier d'un employé (plannedStart, plannedEnd, actualStart, actualEnd, breakMinutes, status) |
| `ClockEntry` *(nouveau)* | Événement de pointage QR (action, timestamp, source: qr/admin, editedById, editReason, originalTimestamp) |
| `Absence` | Demande d'absence |
| `Adjustment` | Ajustement manuel d'heures (ADMIN) |
| `MonthlyValidation` | Fiche mensuelle (statut workflow RH) |
| `AuditLog` | Journal d'audit de toutes les actions sensibles |
| `Notification` | Notifications in-app |
| `CabinetSettings` | Paramètres du cabinet (singleton id="default") |

### Relations importantes sur User
```
clockEntries       ClockEntry[] @relation("ClockEntryOwner")
editedClockEntries ClockEntry[] @relation("ClockEntryEditor")
assignmentsAsAssistant   @relation("AssistantAssignments")   ← NOM EXACT à utiliser
assignmentsAsPractitioner @relation("PractitionerAssignments") ← NOM EXACT à utiliser
```
⚠️ Ne jamais utiliser `assistantAssignments` ou `practitionerAssignments` — ces anciens noms causaient des erreurs Prisma, ils ont été corrigés.

---

## 5. Rôles et accès aux routes

```ts
// lib/permissions.ts — ROUTE_ACCESS
/dashboard        → ADMIN, RH
/mon-espace       → ASSISTANT
/mes-horaires     → ASSISTANT
/pointage         → ADMIN, RH, ASSISTANT   ← nouveau
/espace-praticien → PRATICIEN
/planning         → ADMIN, RH, PRATICIEN
/equipe           → ADMIN, RH              (inclut /equipe/pointage)
/absences         → ADMIN, RH, ASSISTANT, PRATICIEN
/validations      → ADMIN, RH, ASSISTANT, COMPTABLE
/rapports         → ADMIN, RH, COMPTABLE
/parametres       → ADMIN, RH
/audit            → ADMIN
```

Après login, chaque rôle est redirigé vers :
- ADMIN/RH → `/dashboard`
- PRATICIEN → `/espace-praticien`
- ASSISTANT → `/mon-espace`
- COMPTABLE → `/rapports`

---

## 6. Système d'authentification

- Cookie httpOnly `faradayboard_session` contenant un JWT signé
- `getSession()` décode le JWT **sans** requête DB (rapide, mais stale si DB reseed)
- `getFreshSessionUser()` vérifie en DB (à utiliser dans actions sensibles)
- SESSION_SECRET dans `.env` (défaut dev : "dev-secret-non-securise-a-changer")
- Durée session : 8h sans "rester connecté", 30 jours avec

⚠️ **Bug connu résolu** : Si la DB est reseedée après connexion, `session.id` pointe vers un utilisateur inexistant → `writeAuditLog` crashait avec FK violation. Corrigé : `writeAuditLog` est maintenant dans un try/catch et ne crash plus jamais les actions métier.

---

## 7. Système de pointage QR (NOUVEAU — ajouté en dernier)

### Flux mobile
1. Admin génère/affiche les 4 QR codes depuis `/equipe/pointage`
2. Assistante scanne avec son téléphone → `http://[IP]:3000/pointage/debut` (ou pause-debut, pause-fin, fin)
3. Si non connectée → redirigée vers `/login?redirect=/pointage/debut`
4. Après login → retour automatique sur `/pointage/debut`
5. Page affiche un bouton "Confirmer" → enregistre le pointage → affiche confirmation avec heure/nom

### Validation des transitions
```
ABSENT → DEBUT_JOURNEE ✅
DEBUT_JOURNEE → DEBUT_PAUSE ✅
DEBUT_PAUSE → FIN_PAUSE ✅
FIN_PAUSE → DEBUT_PAUSE ✅ (nouvelle pause)
FIN_PAUSE → FIN_JOURNEE ✅
DEBUT_JOURNEE → FIN_JOURNEE ✅
Tout autre ordre → erreur explicite
```

### QR codes
Générés côté client via `https://quickchart.io/qr?text=[URL encodée]` (pas de npm, requiert internet pour charger l'image du QR, mais l'URL encodée est locale).

### Correction admin
L'admin peut depuis `/equipe/pointage` :
- Modifier l'heure d'un pointage existant (motif obligatoire)
- Ajouter un pointage oublié (motif obligatoire)
Toute correction est tracée dans `AuditLog` avec l'ancienne valeur.

---

## 8. État actuel du projet

### ✅ Fonctionnel et en place
- Auth complète (login/logout/invitation/activation compte)
- Gestion utilisateurs (créer/modifier/désactiver, rôle ADMIN uniquement pour créer)
- Planning (templates horaires)
- Suivi horaires quotidiens (WorkEntry)
- Validations mensuelles (workflow RH → employé → comptable)
- Exports PDF et CSV
- Gestion absences
- Journal d'audit
- Notifications in-app
- Dashboard admin avec KPIs
- Dashboard heures par employé (/equipe/heures) : écart prévu vs réel
- Page d'aide (/aide)
- Système QR pointage (ClockEntry) — **migration faite, dev server tourne**

### ⏳ À vérifier / à faire
1. **Lancer `npm run build`** pour vérifier qu'il n'y a pas d'erreurs TypeScript sur les nouveaux fichiers (ClockEntry, pointage pages, AdminClockEdit)
2. **Tester le flux complet de pointage** : login assistante → scan QR → confirmation
3. **Configurer SMTP Gmail** (tâche explicitement différée par le client — ne pas toucher sans qu'il en parle)
4. Il peut rester des erreurs TS mineures dans les nouveaux composants à corriger

### ⚠️ Points d'attention
- Le dev server tourne dans une fenêtre cmd séparée (`npm run dev`) — ne pas la fermer
- Si le serveur s'arrête : `cd C:\...\FaradayBoard && npm run dev`
- Après un `npm run build`, le dev server NE se relance pas automatiquement
- Le cookie de session peut être stale après un reseed DB → dire à l'utilisateur de se déconnecter/reconnecter

---

## 9. Variables d'environnement (.env)

```
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="..."         ← clé JWT, ne pas changer en cours de session
NEXTAUTH_URL="http://localhost:3000"  ← optionnel
# SMTP non configuré pour l'instant :
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM=
```

---

## 10. Commandes utiles

```bash
# Lancer le dev server
npm run dev

# Build production (vérification TypeScript complète)
npm run build

# Prisma
npx prisma migrate dev --name [nom]   # nouvelle migration
npx prisma db push                    # sync schéma sans migration
npx prisma studio                     # UI pour explorer la DB
npx prisma db seed                    # reseed données démo

# Voir les logs du serveur → fenêtre cmd où tourne npm run dev
```

---

## 11. Conventions de code

- Toutes les pages sont des **Server Components** par défaut (async, pas de "use client")
- Les formulaires interactifs utilisent `useActionState` (pas useState + fetch)
- Les Server Actions sont dans `lib/actions/` avec `"use server"` en tête
- Les composants clients ont `"use client"` en première ligne
- Pas de `any` TypeScript
- Classes CSS : utiliser les classes custom du projet (`card`, `btn-primary`, `btn-secondary`, `input`, `label`, `badge`) — voir `tailwind.config.ts` et `globals.css`
- Couleurs : `faraday-*` (vert principal du cabinet), `ardoise-*` (gris neutre)

---

## 12. Données de démo (après seed)

Comptes disponibles pour tester :
| Email | Mot de passe | Rôle |
|---|---|---|
| admin@cabinet-faraday.fr | Admin1234! | ADMIN |
| rh@cabinet-faraday.fr | Admin1234! | RH |
| sophie.martin@cabinet-faraday.fr | Admin1234! | ASSISTANT |
| claire.dupont@cabinet-faraday.fr | Admin1234! | ASSISTANT |
| dr.bernard@cabinet-faraday.fr | Admin1234! | PRATICIEN |
| comptable@cabinet-faraday.fr | Admin1234! | COMPTABLE |

*(Si ces comptes n'existent plus → `npx prisma db seed`)*

---

Tu peux maintenant prendre la suite. Commence par lancer `npm run build` pour vérifier l'état du code, corrige les éventuelles erreurs TypeScript, puis continue avec ce qui est dans la section "À vérifier / à faire".
