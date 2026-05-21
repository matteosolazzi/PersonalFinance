import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}
