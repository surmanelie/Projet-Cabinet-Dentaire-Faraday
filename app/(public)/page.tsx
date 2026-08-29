import type { Metadata } from "next";
import Link from "next/link";
import SectionLabel from "@/components/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import TexturePanel from "@/components/public/TexturePanel";

export const metadata: Metadata = {
  title: "Surmaly — Gestion du temps de votre équipe",
  description: "Planning, pointage et suivi des horaires pour votre cabinet.",
};

const VALUES = [
  {
    n: "01",
    title: "Pointage",
    text: "Chaque membre de l'équipe pointe en un geste, par QR code ou code personnel.",
  },
  {
    n: "02",
    title: "Planning",
    text: "Horaires, absences et validations mensuelles réunis dans un espace unique.",
  },
  {
    n: "03",
    title: "Suivi",
    text: "Un tableau de bord précis pour l'administrateur, un espace dédié pour chacun.",
  },
];

const STEPS = [
  { n: "01", title: "Connexion", text: "Chaque personne accède à son espace, selon son rôle." },
  { n: "02", title: "Pointage", text: "Un geste au comptoir ou depuis son téléphone." },
  { n: "03", title: "Validation", text: "Le mois se clôture proprement, sans ressaisie." },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-content px-6 pb-16 pt-20 md:px-12 md:pb-24 md:pt-32">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-6">
          <Reveal className="md:col-span-8 md:col-start-1">
            <SectionLabel index="01">Gestion du temps</SectionLabel>
            <h1 className="mt-6 font-semibold tracking-tight text-[clamp(3rem,7vw,7rem)] leading-[0.98] text-ardoise-900">
              La précision,
              <br />
              au service du soin.
            </h1>
          </Reveal>

          <Reveal
            delay={0.15}
            className="flex flex-col justify-end gap-6 md:col-span-4 md:col-start-9"
          >
            <p className="text-base leading-relaxed text-ardoise-600">
              Planning, pointage et suivi des horaires — un outil calme et
              précis, pensé pour votre équipe.
            </p>
            <div>
              <Link href="/login" className="btn-primary">
                Se connecter
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.25} className="mt-16 md:mt-24">
          <TexturePanel tone="sage" className="aspect-[21/9] w-full" />
        </Reveal>
      </section>

      {/* ── Valeurs ── */}
      <section className="mx-auto max-w-content px-6 py-16 md:px-12 md:py-[var(--spacing-section-sm)]">
        <Reveal>
          <SectionLabel index="02">Ce qui nous distingue</SectionLabel>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-10 border-t border-ardoise-200 md:grid-cols-3 md:gap-0">
          {VALUES.map((v, i) => (
            <Reveal
              key={v.n}
              delay={i * 0.1}
              className={`border-ardoise-200 pt-8 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0 ${i === 0 ? "md:pl-0" : ""}`}
            >
              <span className="font-semibold tracking-tight text-2xl text-faraday-400">{v.n}</span>
              <h3 className="mt-3 text-base font-medium text-ardoise-900">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ardoise-600">{v.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="mx-auto max-w-content px-6 py-16 md:px-12 md:py-[var(--spacing-section-sm)]">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          <Reveal className="md:col-span-5">
            <SectionLabel index="03">Fonctionnement</SectionLabel>
            <h2 className="mt-6 font-semibold tracking-tight text-4xl leading-tight text-ardoise-900 md:text-5xl">
              Trois gestes,
              <br />
              un mois maîtrisé.
            </h2>
          </Reveal>

          <div className="md:col-span-6 md:col-start-7">
            <ul className="space-y-0 divide-y divide-ardoise-200 border-t border-ardoise-200">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.1} as="li" className="flex items-baseline gap-6 py-6">
                  <span className="font-semibold tracking-tight text-xl text-faraday-400">{s.n}</span>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-ardoise-900">
                      {s.title}
                    </p>
                    <p className="mt-1 text-sm text-ardoise-600">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="px-6 pb-24 md:px-12">
        <Reveal className="mx-auto max-w-content overflow-hidden rounded-md bg-faraday-700 px-8 py-16 text-center md:px-16 md:py-24">
          <p className="font-semibold tracking-tight text-[clamp(2rem,4.5vw,4rem)] leading-tight text-creme-50">
            Prêt à simplifier
            <br />
            la gestion de votre équipe&nbsp;?
          </p>
          <div className="mt-10">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded border border-creme-50/40 px-6 py-3 text-sm font-medium tracking-wide text-creme-50 transition-all duration-300 ease-premium hover:border-creme-50 hover:bg-creme-50/10"
            >
              Se connecter
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
