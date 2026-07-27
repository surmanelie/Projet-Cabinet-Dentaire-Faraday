import type { Metadata } from "next";
import { SITE } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `Qui sommes-nous ? — ${SITE.name}`,
  description: "L'équipe et la mission derrière Surmaly.",
};

export default function QuiSommesNousPage() {
  const { about } = SITE;
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ardoise-900 md:text-4xl">Qui sommes-nous&nbsp;?</h1>

      <div className="mt-8 space-y-8">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ardoise-400">Notre histoire</h2>
          <p className="mt-2 text-ardoise-700">{about.story}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ardoise-400">Notre mission</h2>
          <p className="mt-2 text-ardoise-700">{about.mission}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ardoise-400">Nos valeurs</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {about.values.map((v) => (
              <span key={v} className="rounded-full bg-faraday-50 px-3 py-1 text-sm font-medium text-faraday-700">{v}</span>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ardoise-400">Notre vision</h2>
          <p className="mt-2 text-ardoise-700">{about.vision}</p>
        </div>
      </div>

      <p className="mt-10 rounded-xl bg-ardoise-50 px-4 py-3 text-sm text-ardoise-500">
        Ces textes sont provisoires (« [À compléter] ») et se modifient dans <code className="text-ardoise-700">lib/site-content.ts</code>.
      </p>
    </section>
  );
}
