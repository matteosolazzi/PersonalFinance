import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AdminContent } from "./admin-content";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <AppShell>
      <AdminContent />
    </AppShell>
  );
}
