import "server-only";
import PDFDocument from "pdfkit";
import type { MonthlySummary } from "@/lib/hours-engine";

type DailyEntry = {
  date: Date;
  actualStart: string;
  actualEnd: string;
  breakMinutes: number;
  totalMinutes: number;
};

type EmployeeRecapData = {
  cabinetName: string;
  employeeName: string;
  month: number;
  year: number;
  summary: MonthlySummary;
  status: string;
  dailyEntries: DailyEntry[];
};

function formatDayMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Génère le PDF de récapitulatif mensuel individuel pour un salarié. */
export function generateEmployeeRecapPdf(data: EmployeeRecapData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).fillColor("#0f6157").text(data.cabinetName, { align: "left" });
    doc.fontSize(12).fillColor("#475569").text("Récapitulatif mensuel des heures");
    doc.moveDown();

    doc.fontSize(11).fillColor("#0f172a");
    doc.text(`Salarié(e) : ${data.employeeName}`);
    doc.text(`Période : ${MONTHS_FR[data.month - 1]} ${data.year}`);
    doc.text(`Statut de validation : ${data.status}`);
    doc.moveDown();

    const rows: [string, string][] = [
      ["Heures prévues (contrat)", `${data.summary.totalPlannedHours.toFixed(2)} h`],
      ["Heures travaillées", `${data.summary.totalWorkedHours.toFixed(2)} h`],
      ["Heures d'absence", `${data.summary.totalAbsenceHours.toFixed(2)} h`],
      ["Ajustements manuels", `${data.summary.totalAdjustmentHours.toFixed(2)} h`],
      ["Heures supplémentaires / complémentaires", `${data.summary.overtimeHours.toFixed(2)} h`],
      ["Heures de déficit", `${data.summary.deficitHours.toFixed(2)} h`],
      ["Solde final", `${data.summary.balanceHours >= 0 ? "+" : ""}${data.summary.balanceHours.toFixed(2)} h`],
    ];

    doc.fontSize(11);
    rows.forEach(([label, value]) => {
      doc.text(label, { continued: true, width: 350 });
      doc.text(value, { align: "right" });
    });

    doc.moveDown(1.5);

    // Détail jour par jour des heures RÉELLEMENT pointées (jamais le
    // planning théorique) : date, horaires réels, pause, total du jour.
    doc.fontSize(12).fillColor("#0f172a").text("Détail des jours travaillés (heures réellement pointées)");
    doc.moveDown(0.5);

    if (data.dailyEntries.length === 0) {
      doc.fontSize(10).fillColor("#64748b").text("Aucun pointage réel enregistré sur cette période.");
    } else {
      const colX = [50, 160, 250, 340, 430];
      const headers = ["Date", "Début", "Fin", "Pause", "Total du jour"];
      doc.fontSize(9).fillColor("#475569");
      headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 100, continued: i < headers.length - 1 }));
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cbd5e1").stroke();
      doc.moveDown(0.3);

      doc.fontSize(9).fillColor("#0f172a");
      for (const entry of data.dailyEntries) {
        if (doc.y > 720) doc.addPage();
        const y = doc.y;
        const dateLabel = entry.date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" });
        doc.text(dateLabel, colX[0], y, { width: 100 });
        doc.text(entry.actualStart, colX[1], y, { width: 80 });
        doc.text(entry.actualEnd, colX[2], y, { width: 80 });
        doc.text(`${entry.breakMinutes} min`, colX[3], y, { width: 80 });
        doc.text(formatDayMinutes(entry.totalMinutes), colX[4], y, { width: 90 });
        doc.moveDown(0.5);
      }
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#94a3b8").text(`Document généré le ${new Date().toLocaleString("fr-FR")} — usage interne au cabinet.`);

    doc.end();
  });
}

type GlobalReportRow = {
  employeeName: string;
  summary: MonthlySummary;
};

/** Génère le PDF global comptable pour l'ensemble des salariés sur une période. */
export function generateGlobalAccountingPdf(
  cabinetName: string,
  month: number,
  year: number,
  rows: GlobalReportRow[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).fillColor("#0f6157").text(cabinetName);
    doc.fontSize(12).fillColor("#475569").text(`Synthèse comptable — ${MONTHS_FR[month - 1]} ${year}`);
    doc.moveDown();

    const colX = [40, 220, 320, 420, 520, 620, 720];
    const headers = ["Salarié(e)", "Prévu (h)", "Travaillé (h)", "Absences (h)", "Ajust. (h)", "Heures sup. (h)", "Solde (h)"];

    doc.fontSize(10).fillColor("#0f172a");
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 100 }));
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(800, doc.y).strokeColor("#cbd5e1").stroke();
    doc.moveDown(0.5);

    rows.forEach((row) => {
      const y = doc.y;
      doc.text(row.employeeName, colX[0], y, { width: 170 });
      doc.text(row.summary.totalPlannedHours.toFixed(1), colX[1], y, { width: 90 });
      doc.text(row.summary.totalWorkedHours.toFixed(1), colX[2], y, { width: 90 });
      doc.text(row.summary.totalAbsenceHours.toFixed(1), colX[3], y, { width: 90 });
      doc.text(row.summary.totalAdjustmentHours.toFixed(1), colX[4], y, { width: 90 });
      doc.text(row.summary.overtimeHours.toFixed(1), colX[5], y, { width: 90 });
      doc.text(row.summary.balanceHours.toFixed(1), colX[6], y, { width: 90 });
      doc.moveDown(0.7);
    });

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#94a3b8").text(`Document généré le ${new Date().toLocaleString("fr-FR")}.`);

    doc.end();
  });
}
