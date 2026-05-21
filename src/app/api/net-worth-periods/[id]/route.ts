import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const period = await prisma.netWorthPeriod.findUnique({
    where: { id },
    include: {
      values: {
        include: { assetItem: { include: { category: true } } },
      },
    },
  });

  if (!period) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(period);
}

// Save all values for a period (bulk update)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { values } = await request.json() as {
    values: Array<{
      assetItemId: string;
      value: number;
      shares?: number | null;
      pricePerShare?: number | null;
    }>;
  };

  await Promise.all(
    values.map((v) =>
      prisma.netWorthValue.upsert({
        where: { periodId_assetItemId: { periodId: id, assetItemId: v.assetItemId } },
        update: {
          value: v.value,
          shares: v.shares ?? null,
          pricePerShare: v.pricePerShare ?? null,
        },
        create: {
          periodId: id,
          assetItemId: v.assetItemId,
          value: v.value,
          shares: v.shares ?? null,
          pricePerShare: v.pricePerShare ?? null,
        },
      })
    )
  );

  const updated = await prisma.netWorthPeriod.findUnique({
    where: { id },
    include: {
      values: {
        include: { assetItem: { include: { category: true } } },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.netWorthPeriod.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
