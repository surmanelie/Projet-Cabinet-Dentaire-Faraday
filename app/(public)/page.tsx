import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Surmaly — Gestion du temps de votre équipe",
  description: "Planning, pointage et suivi des horaires pour votre cabinet.",
};

const VALUE_PROPS = [
  {
    title: "Pointage simple",
    text: "Chaque membre de l'équipe pointe en un geste, par QR code ou code personnel.",
  },
  {
    title: "Planning centralisé",
    text: "Horaires, absences et validations mensuelles au même endroit.",
  },
  {
    title: "Suivi en temps réel",
    text: "Un tableau de bord clair pour l'administrateur, un espace dédié pour chacun.",
  },
];

export default function LandingPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 pt-20 text-center md:px-6 md:pt-28">
      <span className="inline-block rounded-full bg-faraday-50 px-3 py-1 text-xs font-medium text-faraday-700">
        Pointage · Horaires · Congés
      </span>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ardoise-900 md:text-5xl">
        Surmaly
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-ardoise-600">
        L&apos;outil interne de gestion du temps de votre équipe.
      </p>
      <div className="mt-8 flex justify-center">
        <Link href="/login" className="btn-primary">Se connecter</Link>
      </div>

      <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
        {VALUE_PROPS.map((v) => (
          <div key={v.title} className="rounded-2xl border border-ardoise-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-ardoise-900">{v.title}</h3>
            <p className="mt-2 text-sm text-ardoise-600">{v.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
