import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { invoiceNumber, date, clientId, amount, amountAccrued, notes } = body;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      invoiceNumber,
      date: new Date(date),
      clientId,
      amount,
      amountAccrued: amountAccrued ?? 0,
      notes,
    },
    include: { client: true },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
