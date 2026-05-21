import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AllocationContent } from "./allocation-content";

export default async function AllocationPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <AppShell>
      <AllocationContent />
    </AppShell>
  );
}
