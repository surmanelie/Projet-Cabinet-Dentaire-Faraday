# Mettre FaradayBoard en ligne (hébergement permanent)

Ce guide met le site sur internet de façon permanente : accessible 24h/24 depuis
n'importe où, **même l'ordinateur du cabinet éteint**. Les QR codes fonctionneront
alors depuis n'importe quel téléphone (Wi-Fi ou 4G).

On utilise 3 services **gratuits** :
- **Neon** → la base de données PostgreSQL en ligne
- **GitHub** → pour stocker le code
- **Vercel** → pour héberger le site Next.js

> Le code est **déjà préparé** pour cet hébergement (base PostgreSQL, migrations,
> build Vercel). Il ne reste que la création des comptes et quelques réglages.

---

## Étape 1 — Créer la base de données (Neon)

1. Aller sur **https://neon.tech** → **Sign up** (connexion possible avec Google/GitHub).
2. Créer un projet (**New Project**). Région conseillée : Europe (Frankfurt).
3. Une fois créé, ouvrir **Connection Details** / **Connection string**.
4. Copier la chaîne qui ressemble à :
   ```
   postgresql://user:motdepasse@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   **Gardez cette chaîne** : c'est votre `DATABASE_URL`.

---

## Étape 2 — Mettre le code sur GitHub

1. Créer un compte sur **https://github.com** si besoin.
2. Créer un dépôt **privé** (**New repository**) — par ex. `faradayboard`. Ne rien cocher (pas de README).
3. Sur l'ordinateur, dans le dossier du projet, envoyer le code (les commandes exactes
   seront fournies par GitHub après création du dépôt, du type) :
   ```bash
   git remote add origin https://github.com/VOTRE-COMPTE/faradayboard.git
   git branch -M main
   git push -u origin main
   ```

> Le dépôt **doit être privé** : il contient la logique de l'application.
> Aucun mot de passe ni secret n'est dans le code (les secrets vont dans Vercel).

---

## Étape 3 — Héberger sur Vercel

1. Aller sur **https://vercel.com** → **Sign up** → se connecter **avec GitHub**.
2. **Add New… → Project** → importer le dépôt `faradayboard`.
3. Avant de déployer, ouvrir **Environment Variables** et ajouter **deux** variables :

   | Nom | Valeur |
   |---|---|
   | `DATABASE_URL` | la chaîne Neon copiée à l'étape 1 |
   | `SESSION_SECRET` | voir ci-dessous |

   Clé `SESSION_SECRET` déjà générée pour vous (copiez-la telle quelle) :
   ```
   oPDGRYQ/7E7B3mMHm6QUOloNVnvs6z8BR3D64DPh8stFGuJfZ3tPvE9xGJ6+A1Wt
   ```
4. Cliquer sur **Deploy**. Vercel installe, applique les migrations (crée les tables),
   puis met le site en ligne. À la fin, vous obtenez une adresse du type :
   ```
   https://faradayboard.vercel.app
   ```

---

## Étape 4 — Créer les comptes de départ (seed)

La base est vide au premier déploiement. Pour créer l'**administrateur** et
l'**assistante exemple**, lancer une seule fois, sur l'ordinateur, dans le dossier du projet :

```bash
# PowerShell (Windows) :
$env:DATABASE_URL="LA-CHAINE-NEON"
npm run db:seed
```

Cela crée :
- Administrateur : `admin@cabinet-faraday.fr` / `Admin1234!`
- Assistante exemple : `assistante@cabinet-faraday.fr` / `Assistante1234!`
- Code de pointage de l'assistante : `1234`

> Ces comptes restent **modifiables et supprimables** depuis l'écran **Équipe**.
> Changez le mot de passe administrateur après la première connexion.

---

## Étape 5 — Vérifier

1. Ouvrir `https://VOTRE-SITE.vercel.app/login` et se connecter en admin.
2. Menu **Pointage QR** : les QR codes pointent automatiquement vers l'adresse en
   ligne (plus besoin d'IP locale ni de Wi-Fi).
3. Scanner un QR depuis un téléphone (même en 4G), saisir le code `1234`, confirmer.

---

## Notes importantes

- **Nom de domaine** : vous pouvez brancher une adresse personnalisée
  (ex. `pointage.cabinet-faraday.fr`) dans Vercel → **Domains**.
- **Sauvegardes sur disque** : la fonction de sauvegarde/restauration par fichier
  (écran Paramètres → Sauvegarde) ne fonctionne pas sur Vercel (pas de disque
  permanent). Les données sont dans Neon, qui gère ses propres sauvegardes ;
  cette fonction fichier devra être adaptée plus tard si besoin.
- **Emails d'invitation** : toujours désactivés tant que le SMTP n'est pas configuré ;
  l'admin peut définir directement les mots de passe et les codes de pointage.
- **Mises à jour** : à chaque `git push`, Vercel redéploie automatiquement.
