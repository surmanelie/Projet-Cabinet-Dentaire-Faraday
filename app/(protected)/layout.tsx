import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { getUnreadNotifications } from "@/lib/actions/notifications";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await getUnreadNotifications();

  return (
    <div className="flex min-h-screen bg-ardoise-50">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col">
        <TopBar user={session} notifications={notifications} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
