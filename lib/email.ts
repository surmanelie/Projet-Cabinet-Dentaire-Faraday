import "server-only";
import nodemailer from "nodemailer";

/**
 * Envoi d'emails — désactivé tant que SMTP_HOST/SMTP_USER/SMTP_PASS ne sont
 * pas renseignés dans .env. En attendant, les liens (invitation, etc.) sont
 * simplement renvoyés à l'appelant pour être affichés/copiés manuellement
 * par l'administrateur : aucune fonctionnalité n'est bloquée par l'absence
 * de SMTP.
 */
function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getAppUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    // VERCEL_PROJECT_PRODUCTION_URL est le domaine de production stable
    // (ex: mon-projet.vercel.app) ; VERCEL_URL est propre à CHAQUE
    // déploiement (change à chaque déploiement) et ne doit servir qu'en
    // tout dernier recours (ex: preview sans domaine de prod assigné).
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "http://localhost:3000"
  );
}

type SendResult = { sent: boolean };

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  link: string
): Promise<SendResult> {
  const transport = getTransport();
  if (!transport) {
    console.log(`[email désactivé] Lien de réinitialisation pour ${to} : ${link}`);
    return { sent: false };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: "Réinitialisation de votre mot de passe FaradayBoard",
    html: `
      <p>Bonjour ${firstName},</p>
      <p>Un administrateur a demandé la réinitialisation de votre mot de passe FaradayBoard.</p>
      <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
      <p><a href="${link}">${link}</a></p>
      <p>Ce lien est valable 7 jours.</p>
    `,
  });
  return { sent: true };
}
