import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { categoryId, name, broker, isPrivateEquity, isShares, geoAllocUs, geoAllocDevExUs, geoAllocEm } = body;

  const item = await prisma.assetItem.create({
    data: {
      categoryId,
      name,
      broker: broker || null,
      isPrivateEquity: isPrivateEquity ?? false,
      isShares: isShares ?? false,
      geoAllocUs: geoAllocUs ?? null,
      geoAllocDevExUs: geoAllocDevExUs ?? null,
      geoAllocEm: geoAllocEm ?? null,
    },
    include: { category: true },
  });

  return NextResponse.json(item, { status: 201 });
}
