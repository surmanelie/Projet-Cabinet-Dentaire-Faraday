import "server-only";
import type { MonthlySummary } from "@/lib/hours-engine";

function escapeCsvField(value: string): string {
  if (/[";\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatFrDate(d: Date): string {
  return d.toLocaleDateString("fr-FR");
}

function formatFrNumber(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

type GlobalReportRow = {
  employeeName: string;
  summary: MonthlySummary;
};

/**
 * Génère un CSV compatible Excel (séparateur ; pour le format français,
 * encodage UTF-8 avec BOM pour un affichage correct des accents).
 */
export function generateGlobalAccountingCsv(rows: GlobalReportRow[], month: number, year: number): string {
  const headers = [
    "Salarié(e)",
    "Période",
    "Heures prévues",
    "Heures travaillées",
    "Heures d'absence",
    "Ajustements (h)",
    "Heures sup./compl. (h)",
    "Heures de déficit (h)",
    "Solde (h)",
  ];

  const lines = [headers.map(escapeCsvField).join(";")];

  rows.forEach((row) => {
    lines.push(
      [
        row.employeeName,
        `${String(month).padStart(2, "0")}/${year}`,
        formatFrNumber(row.summary.totalPlannedHours),
        formatFrNumber(row.summary.totalWorkedHours),
        formatFrNumber(row.summary.totalAbsenceHours),
        formatFrNumber(row.summary.totalAdjustmentHours),
        formatFrNumber(row.summary.overtimeHours),
        formatFrNumber(row.summary.deficitHours),
        formatFrNumber(row.summary.balanceHours),
      ]
        .map(escapeCsvField)
        .join(";")
    );
  });

  const BOM = "\uFEFF";
  return BOM + lines.join("\r\n");
}

export { formatFrDate };
