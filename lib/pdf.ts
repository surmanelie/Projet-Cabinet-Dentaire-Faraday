import "server-only";
import PDFDocument from "pdfkit";
import type { MonthlySummary } from "@/lib/hours-engine";
import { CABINET_TIMEZONE } from "@/lib/timezone";

type DailyEntry = {
  date: Date;
  actualStart: string;
  actualEnd: string;
  breakMinutes: number;
  totalMinutes: number;
};

type AbsenceEntry = {
  type: string;
  startDate: Date;
  endDate: Date;
  hours: number | null;
};

type EmployeeRecapData = {
  cabinetName: string;
  employeeName: string;
  month: number;
  year: number;
  summary: MonthlySummary;
  status: string;
  dailyEntries: DailyEntry[];
  absences: AbsenceEntry[];
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

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  CONGE_PAYE: "Congé payé",
  ARRET_MALADIE: "Arrêt maladie",
  ABSENCE_EXCEPTIONNELLE: "Absence exceptionnelle",
  ABSENCE_NON_REMUNEREE: "Absence non rémunérée",
  FORMATION: "Formation",
  RECUPERATION: "Récupération",
  AUTRE: "Autre absence",
};

/** Nombre de jours calendaires couverts par une période (inclusive), pour l'affichage récapitulatif. */
function daySpan(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

/** Génère le PDF de récapitulatif mensuel individuel pour un salarié. */
export function generateEmployeeRecapPdf(data: EmployeeRecapData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── En-tête ────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill("#f0f4f2");
    doc.fillColor("#0f6157").fontSize(20).text(data.cabinetName, 50, 30);
    doc.fillColor("#475569").fontSize(11).text(
      `Récapitulatif mensuel des heures — ${MONTHS_FR[data.month - 1]} ${data.year}`,
      50,
      58
    );
    doc.y = 110;

    // ── Informations salarié·e ────────────────────────────────────────────
    const infoRows: [string, string][] = [
      ["Salarié(e)", data.employeeName],
      ["Période", `${MONTHS_FR[data.month - 1]} ${data.year}`],
      ["Statut de validation", data.status],
    ];
    doc.fontSize(10).fillColor("#0f172a");
    infoRows.forEach(([label, value]) => {
      const y = doc.y;
      doc.fillColor("#64748b").text(label, 50, y, { width: 150 });
      doc.fillColor("#0f172a").text(value, 200, y, { width: 345 });
      doc.moveDown(0.4);
    });
    doc.moveDown(0.8);

    // ── Synthèse des heures — jamais de "solde" net, chaque nature d'heure
    // reste distincte et lisible séparément (contrat / réel / formation /
    // supplémentaires / déficit / ajustements).
    doc.fontSize(13).fillColor("#0f6157").text("Synthèse des heures");
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor("#e2e8f0").stroke();
    doc.moveDown(0.6);

    const totalEffectuees = data.summary.totalWorkedHours + data.summary.totalFormationHours;
    const summaryRows: [string, string, boolean?][] = [
      ["Heures prévues (contrat)", `${data.summary.totalPlannedHours.toFixed(2)} h`],
      ["Heures effectuées au cabinet (pointées)", `${data.summary.totalWorkedHours.toFixed(2)} h`],
      ["Heures de formation (hors cabinet, non pointées)", `${data.summary.totalFormationHours.toFixed(2)} h`],
      ["Total heures effectuées", `${totalEffectuees.toFixed(2)} h`, true],
      ["Heures supplémentaires / complémentaires", `${data.summary.overtimeHours.toFixed(2)} h`],
      ["Heures de déficit", `${data.summary.deficitHours.toFixed(2)} h`],
      ["Ajustements manuels", `${data.summary.totalAdjustmentHours.toFixed(2)} h`],
    ];
    summaryRows.forEach(([label, value, emphasis]) => {
      const y = doc.y;
      doc.fontSize(emphasis ? 11 : 10).fillColor(emphasis ? "#0f172a" : "#334155").text(label, 50, y, { width: 350 });
      doc.fontSize(emphasis ? 11 : 10).fillColor("#0f172a").text(value, 400, y, { width: 145, align: "right" });
      doc.moveDown(emphasis ? 0.5 : 0.35);
    });
    doc.moveDown(0.8);

    // ── Détail jour par jour des heures RÉELLEMENT pointées (jamais le
    // planning théorique) : date, horaires réels, pause, total du jour.
    doc.fontSize(13).fillColor("#0f6157").text("Détail des jours travaillés (heures réellement pointées)");
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor("#e2e8f0").stroke();
    doc.moveDown(0.6);

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

      let rowIndex = 0;
      for (const entry of data.dailyEntries) {
        if (doc.y > 700) {
          doc.addPage();
          doc.y = 50;
        }
        const y = doc.y;
        if (rowIndex % 2 === 1) doc.rect(50, y - 2, 495, 16).fill("#f8fafc");
        doc.fillColor("#0f172a").fontSize(9);
        const dateLabel = entry.date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: CABINET_TIMEZONE });
        doc.text(dateLabel, colX[0], y, { width: 100 });
        doc.text(entry.actualStart, colX[1], y, { width: 80 });
        doc.text(entry.actualEnd, colX[2], y, { width: 80 });
        doc.text(`${entry.breakMinutes} min`, colX[3], y, { width: 80 });
        doc.text(formatDayMinutes(entry.totalMinutes), colX[4], y, { width: 90 });
        doc.moveDown(0.5);
        rowIndex++;
      }
    }

    doc.moveDown(1);

    // ── Absences du mois — détail pour le comptable (arrêts maladie,
    // congés, formation...) : type, dates, durée.
    if (doc.y > 650) {
      doc.addPage();
      doc.y = 50;
    }
    doc.fontSize(13).fillColor("#0f6157").text("Absences du mois");
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor("#e2e8f0").stroke();
    doc.moveDown(0.6);

    if (data.absences.length === 0) {
      doc.fontSize(10).fillColor("#64748b").text("Aucune absence sur cette période.");
    } else {
      const counts = new Map<string, number>();
      for (const a of data.absences) {
        const unit = a.type === "FORMATION" ? (a.hours ?? 0) : daySpan(a.startDate, a.endDate);
        counts.set(a.type, (counts.get(a.type) ?? 0) + unit);
      }
      doc.fontSize(10).fillColor("#334155");
      for (const [type, total] of counts) {
        const label = ABSENCE_TYPE_LABELS[type] ?? type;
        const unitLabel = type === "FORMATION" ? `${total.toFixed(1)} h` : `${total} jour${total > 1 ? "s" : ""}`;
        doc.text(`• ${label} : ${unitLabel}`);
        doc.moveDown(0.2);
      }
      doc.moveDown(0.4);

      const colX = [50, 200, 300, 400];
      const headers = ["Type", "Début", "Fin", "Détail"];
      doc.fontSize(9).fillColor("#475569");
      headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 140, continued: i < headers.length - 1 }));
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cbd5e1").stroke();
      doc.moveDown(0.3);

      doc.fontSize(9).fillColor("#0f172a");
      for (const a of data.absences) {
        if (doc.y > 720) {
          doc.addPage();
          doc.y = 50;
        }
        const y = doc.y;
        doc.text(ABSENCE_TYPE_LABELS[a.type] ?? a.type, colX[0], y, { width: 140 });
        doc.text(a.startDate.toLocaleDateString("fr-FR", { timeZone: CABINET_TIMEZONE }), colX[1], y, { width: 90 });
        doc.text(a.endDate.toLocaleDateString("fr-FR", { timeZone: CABINET_TIMEZONE }), colX[2], y, { width: 90 });
        doc.text(a.type === "FORMATION" && a.hours ? `${a.hours} h` : `${daySpan(a.startDate, a.endDate)} j`, colX[3], y, { width: 140 });
        doc.moveDown(0.4);
      }
    }

    doc.moveDown(1.5);
    doc.fontSize(9).fillColor("#94a3b8").text(`Document généré le ${new Date().toLocaleString("fr-FR", { timeZone: CABINET_TIMEZONE })} — usage interne au cabinet.`);

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

    const colX = [40, 200, 290, 380, 470, 560, 650, 740];
    const headers = ["Salarié(e)", "Prévu (h)", "Effectué (h)", "Formation (h)", "Absences (h)", "Ajust. (h)", "Heures sup. (h)", "Déficit (h)"];

    doc.fontSize(10).fillColor("#0f172a");
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 90 }));
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(800, doc.y).strokeColor("#cbd5e1").stroke();
    doc.moveDown(0.5);

    rows.forEach((row) => {
      const y = doc.y;
      doc.text(row.employeeName, colX[0], y, { width: 150 });
      doc.text(row.summary.totalPlannedHours.toFixed(1), colX[1], y, { width: 80 });
      doc.text(row.summary.totalWorkedHours.toFixed(1), colX[2], y, { width: 80 });
      doc.text(row.summary.totalFormationHours.toFixed(1), colX[3], y, { width: 80 });
      doc.text(row.summary.totalAbsenceHours.toFixed(1), colX[4], y, { width: 80 });
      doc.text(row.summary.totalAdjustmentHours.toFixed(1), colX[5], y, { width: 80 });
      doc.text(row.summary.overtimeHours.toFixed(1), colX[6], y, { width: 80 });
      doc.text(row.summary.deficitHours.toFixed(1), colX[7], y, { width: 80 });
      doc.moveDown(0.7);
    });

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#94a3b8").text(`Document généré le ${new Date().toLocaleString("fr-FR", { timeZone: CABINET_TIMEZONE })}.`);

    doc.end();
  });
}
