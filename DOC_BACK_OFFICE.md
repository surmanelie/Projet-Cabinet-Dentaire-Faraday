# Surmaly — Documentation interne du back-office propriétaire

> Document **interne**. Le back-office n'est **pas** une fonctionnalité des entreprises clientes.
> Aucun PDF existant n'a été trouvé pour cette partie ; ce Markdown est prêt à exporter en PDF.

## 1. Rôle et accès
- Rôle plateforme : **`SUPER_ADMIN`** (propriétaire). Distinct de `ADMIN` (administrateur d'une entreprise cliente).
- Le `SUPER_ADMIN` administre la plateforme, **pas** une entreprise : il n'est rattaché à aucune société (`companyId = null`).
- Back-office accessible sur **`/platform-admin`**.
- Protection : middleware (`ROUTE_ACCESS` → `SUPER_ADMIN`) **et** vérification en base dans le layout (`requireOwner`) **et** dans chaque action (`assertOwner`). Masquer un bouton ne suffit pas : un client qui saisit l'URL est refusé côté serveur.

## 2. Créer le premier propriétaire (jamais via l'inscription)
```
npm run make:owner -- votre.email@exemple.com "MotDePasseSolide123"
```
Promeut un compte existant ou en crée un nouveau en `SUPER_ADMIN`. L'auto-attribution du rôle est bloquée dans le formulaire de création d'utilisateur.

## 3. Tableau de bord
Indicateurs réels (base + Stripe) : nombre d'entreprises (total / actives / en attente / suspendues / résiliées), nouvelles ce mois, passes offerts, utilisateurs clients, abonnements payants actifs, **MRR estimé**. Liste des dernières entreprises.

## 4. Entreprises
- Liste paginée avec **recherche** (nom, e-mail, ID client Stripe) et **filtres** (actives, en attente, suspendues, résiliées, offertes).
- **Fiche entreprise** : coordonnées administratives, abonnement (offre, statut, période, IDs Stripe), utilisateurs (champs administratifs), notes internes.
- **Actions** (chacune confirmée + journalisée) : suspendre / réactiver l'accès, résilier à la fin de période, résilier immédiatement (double confirmation par saisie du nom), note interne.

## 5. Passe gratuit (offrir un abonnement, sans carte)
- Création manuelle d'une entreprise **offerte** : `/platform-admin/entreprises/nouvelle`.
- `accessType = FREE`, `status = ACTIVE`, `freeUntil` (date ou vide = permanent). **Aucune carte, aucun prélèvement Stripe.**
- Le responsable reçoit un **lien d'activation** (choix du mot de passe) ou un mot de passe direct.
- Le back-office distingue clairement « Payant » et « Offert ».

## 6. Contrôle d'accès des entreprises
Un membre d'une entreprise **suspendue / résiliée / expirée** (ou passe gratuit expiré) est redirigé vers `/compte-suspendu`. **Les données ne sont jamais supprimées.** Statut `PAST_DUE` : l'accès est conservé (délai de régularisation).

## 7. Confidentialité (strict)
Le back-office ne charge **que** des champs administratifs. Il **ne lit jamais** : messages privés, pointages, documents, mots de passe, données bancaires. Les requêtes sélectionnent uniquement les champs nécessaires (pas de « charger puis masquer »).

## 8. Journal d'audit
Toutes les actions sensibles sont tracées (`AuditLog`) : suspension, réactivation, résiliation, création d'entreprise offerte, note. Consultable et paginé sur `/platform-admin/journal` (auteur, action, ressource, IP, horodatage).

## 9. Sécurité
Mots de passe hashés (bcrypt), sessions JWT httpOnly, anti-force-brute sur la connexion, vérification en base à chaque accès sensible, aucune donnée bancaire stockée, secrets uniquement en variables d'environnement, webhooks Stripe à signature vérifiée et idempotents.

## 10. À venir (phases suivantes)
Codes promotionnels gérés en base + à l'inscription (Stripe supporte déjà la saisie d'un code au paiement en attendant), mode assistance tracé, incidents, 2FA, graphiques d'évolution, exports CSV, alertes administratives, gestion fine des utilisateurs multi-entreprises.
