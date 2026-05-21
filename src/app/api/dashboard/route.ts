import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentYear = new Date().getFullYear();

  // Get current year invoices
  const invoices = await prisma.invoice.findMany({
    where: { year: currentYear },
    include: { client: true },
    orderBy: { date: "asc" },
  });

  // Get tax rate for current year
  const taxRate = await prisma.taxRate.findFirst({
    where: { year: currentYear },
  });
  const rate = taxRate?.rate ?? 0.24;

  // Compute invoice stats
  let totalRevenue = 0;
  let totalTaxesOwed = 0;
  let totalAccrued = 0;
  let totalNet = 0;

  for (const inv of invoices) {
    totalRevenue += inv.amount;
    const taxesOwed = inv.client.type === "PIVA" ? inv.amount * rate : 0;
    totalTaxesOwed += taxesOwed;
    totalAccrued += inv.amountAccrued;
    totalNet += inv.amount - taxesOwed;
  }

  const delta = totalAccrued - totalTaxesOwed;

  // Get latest net worth period
  const latestPeriod = await prisma.netWorthPeriod.findFirst({
    orderBy: [{ year: "desc" }, { quarter: "desc" }],
    include: {
      values: {
        include: { assetItem: { include: { category: true } } },
      },
    },
  });

  // Get all periods for chart
  const allPeriods = await prisma.netWorthPeriod.findMany({
    orderBy: [{ year: "asc" }, { quarter: "asc" }],
    include: {
      values: {
        include: { assetItem: { include: { category: true } } },
      },
    },
  });

  return NextResponse.json({
    invoices: {
      year: currentYear,
      totalRevenue,
      totalTaxesOwed,
      totalAccrued,
      totalNet,
      delta,
      count: invoices.length,
    },
    netWorth: {
      latestPeriod,
      allPeriods,
    },
  });
}
