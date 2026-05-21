import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rates = await prisma.taxRate.findMany({ orderBy: { year: "desc" } });
  return NextResponse.json(rates);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { year, rate } = await request.json();

  const taxRate = await prisma.taxRate.upsert({
    where: { year },
    update: { rate },
    create: { year, rate },
  });

  return NextResponse.json(taxRate);
}
