import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  const invoices = await prisma.invoice.findMany({
    where: year ? { year: parseInt(year) } : undefined,
    include: { client: true },
    orderBy: [{ year: "asc" }, { date: "asc" }],
  });

  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { year, invoiceNumber, date, clientId, amount, amountAccrued, notes } = body;

  const invoice = await prisma.invoice.create({
    data: {
      year,
      invoiceNumber,
      date: new Date(date),
      clientId,
      amount,
      amountAccrued: amountAccrued ?? 0,
      notes,
    },
    include: { client: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
