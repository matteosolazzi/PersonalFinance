import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { NetWorthContent } from "./net-worth-content";

export default async function NetWorthPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <AppShell>
      <NetWorthContent />
    </AppShell>
  );
}
