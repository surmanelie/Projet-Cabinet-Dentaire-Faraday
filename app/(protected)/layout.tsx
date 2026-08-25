import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import { getUnreadNotifications } from "@/lib/actions/notifications";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await getUnreadNotifications();

  return (
    <div className="min-h-screen bg-ardoise-50">
      <TopBar user={session} notifications={notifications} />
      <main className="px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
