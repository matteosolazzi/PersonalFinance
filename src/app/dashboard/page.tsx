import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
