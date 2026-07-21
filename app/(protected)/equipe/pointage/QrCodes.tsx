"use client";

import { useState, useEffect } from "react";

const QR_ACTIONS = [
  { slug: "debut",       label: "Début de journée", icon: "🌅", bg: "bg-emerald-50 border-emerald-200" },
  { slug: "pause-debut", label: "Début de pause",   icon: "☕",  bg: "bg-amber-50 border-amber-200" },
  { slug: "pause-fin",   label: "Fin de pause",     icon: "▶️",  bg: "bg-blue-50 border-blue-200" },
  { slug: "fin",         label: "Fin de journée",   icon: "🌙",  bg: "bg-slate-50 border-slate-200" },
];

export default function QrCodes() {
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    // Récupère l'URL locale du serveur (ex: http://192.168.1.81:3000)
    setBaseUrl(`${window.location.protocol}//${window.location.host}`);
  }, []);

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ardoise-900">QR codes de pointage</h2>
        <button
          onClick={() => window.print()}
          className="btn-secondary text-xs"
        >
          🖨️ Imprimer
        </button>
      </div>
      <p className="mb-4 text-xs text-ardoise-500">
        Affichez ces QR codes sur une tablette ou imprimez-les pour les afficher au cabinet.
        L&apos;assistante scanne le QR code, saisit son <strong>code personnel à 4 chiffres</strong> et confirme —
        aucune connexion nécessaire. Le code se définit dans la fiche de chaque assistante (Équipe → Modifier).
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QR_ACTIONS.map((a) => {
          const targetUrl = baseUrl ? `${baseUrl}/pointer/${a.slug}` : "";
          // quickchart.io génère le QR code côté serveur, sans dépendance npm.
          const qrSrc = targetUrl
            ? `https://quickchart.io/qr?text=${encodeURIComponent(targetUrl)}&size=200&margin=2&dark=3d5649&light=ffffff`
            : "";

          return (
            <div
              key={a.slug}
              className={`flex flex-col items-center rounded-xl border p-4 ${a.bg}`}
            >
              <p className="mb-2 text-2xl">{a.icon}</p>
              <p className="mb-3 text-center text-xs font-semibold text-ardoise-900">
                {a.label}
              </p>
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt={`QR code — ${a.label}`}
                  width={150}
                  height={150}
                  className="rounded-lg"
                />
              ) : (
                <div className="flex h-[150px] w-[150px] items-center justify-center rounded-lg bg-white text-xs text-ardoise-400">
                  Chargement…
                </div>
              )}
              {targetUrl && (
                <p className="mt-2 break-all text-center text-[10px] text-ardoise-400">
                  {targetUrl}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
