"use client";

import { useState, useEffect } from "react";

export default function QrCodes() {
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    setBaseUrl(`${window.location.protocol}//${window.location.host}`);
  }, []);

  const targetUrl = baseUrl ? `${baseUrl}/pointer` : "";
  const qrSrc = targetUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(targetUrl)}&size=280&margin=2&dark=264135&light=ffffff`
    : "";

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ardoise-900">QR code de pointage</h2>
        <button onClick={() => window.print()} className="btn-secondary text-xs">
          Imprimer
        </button>
      </div>
      <p className="mb-4 text-xs text-ardoise-500">
        Un <strong>seul QR code</strong> pour tout le pointage. L&apos;employé le scanne, saisit son
        <strong> code personnel à 4 chiffres</strong>, et l&apos;application ne propose que la bonne action
        (commencer la journée, une pause, reprendre, ou terminer) selon son état du moment.
      </p>

      <div className="flex flex-col items-center">
        <div className="rounded-2xl border border-ardoise-100 p-4">
          {qrSrc ? (
            <img src={qrSrc} alt="QR code de pointage" width={220} height={220} className="rounded-lg" />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg bg-white text-xs text-ardoise-400">
              Chargement…
            </div>
          )}
        </div>
        {targetUrl && (
          <p className="mt-3 break-all text-center text-xs text-ardoise-400">{targetUrl}</p>
        )}
      </div>
    </div>
  );
}
