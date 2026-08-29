import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import SectionLabel from "@/components/SectionLabel";
import CsvExportForm from "./CsvExportForm";

export default async function RapportsCsvPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminOrRh(session.role) && session.role !== "COMPTABLE") redirect("/rapports");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <SectionLabel>Rapports</SectionLabel>
        <h1 className="mt-3 page-title">Export CSV comptable</h1>
      </div>
      <div className="card">
        <CsvExportForm />
      </div>
    </div>
  );
}
