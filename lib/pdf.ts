import "server-only";
import PDFDocument from "pdfkit";
import type { MonthlySummary } from "@/lib/hours-engine";

type EmployeeRecapData = {
  cabinetName: string;
  employeeName: string;
  month: number;
  year: number;
  summary: MonthlySummary;
  status: string;
};

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
