import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const periods = await prisma.netWorthPeriod.findMany({
    orderBy: [{ year: "asc" }, { quarter: "asc" }],
    include: {
      values: {
        include: { assetItem: { include: { category: true } } },
      },
    },
  });

  return NextResponse.json(periods);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { year, quarter } = await request.json();

  const existing = await prisma.netWorthPeriod.findUnique({
    where: { year_quarter: { year, quarter } },
  });

  if (existing) {
    return NextResponse.json({ error: "Period already exists" }, { status: 409 });
  }

  // Get all active asset items to pre-create entries
  const assetItems = await prisma.assetItem.findMany({ where: { isActive: true } });

  // Find last period to copy values from
  const lastPeriod = await prisma.netWorthPeriod.findFirst({
    orderBy: [{ year: "desc" }, { quarter: "desc" }],
    include: { values: true },
  });

  const period = await prisma.netWorthPeriod.create({
    data: {
      year,
      quarter,
      values: {
        create: assetItems.map((item) => {
          const lastValue = lastPeriod?.values.find((v) => v.assetItemId === item.id);
          return {
            assetItemId: item.id,
            value: lastValue?.value ?? 0,
            shares: lastValue?.shares ?? null,
            pricePerShare: lastValue?.pricePerShare ?? null,
          };
        }),
      },
    },
    include: {
      values: {
        include: { assetItem: { include: { category: true } } },
      },
    },
  });

  return NextResponse.json(period, { status: 201 });
}
