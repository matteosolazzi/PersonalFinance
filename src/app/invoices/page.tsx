import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { InvoicesContent } from "./invoices-content";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <AppShell>
      <InvoicesContent />
    </AppShell>
  );
}
