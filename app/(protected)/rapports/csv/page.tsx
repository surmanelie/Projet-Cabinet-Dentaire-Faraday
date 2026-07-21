import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import CsvExportForm from "./CsvExportForm";

export default async function RapportsCsvPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminOrRh(session.role) && session.role !== "COMPTABLE") redirect("/rapports");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-ardoise-900">Export CSV comptable</h1>
      <div className="card">
        <CsvExportForm />
      </div>
    </div>
  );
}
