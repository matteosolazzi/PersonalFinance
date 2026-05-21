import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ClientType } from "@prisma/client";

// One-time setup endpoint: pushes seed data if DB is empty.
// Protected by SETUP_SECRET env var.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-setup-secret");
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingClients = await prisma.client.count();
  if (existingClients > 0) {
    return NextResponse.json({ message: "Already seeded" });
  }

  // ── Tax rates ──────────────────────────────────────────────────────────────
  await prisma.taxRate.upsert({ where: { year: 2025 }, update: {}, create: { year: 2025, rate: 0.24 } });
  await prisma.taxRate.upsert({ where: { year: 2026 }, update: {}, create: { year: 2026, rate: 0.24 } });

  // ── Clients ────────────────────────────────────────────────────────────────
  const daze = await prisma.client.upsert({ where: { name: "Daze" }, update: {}, create: { name: "Daze", type: ClientType.PIVA } });
  const giovy = await prisma.client.upsert({ where: { name: "Giovy" }, update: {}, create: { name: "Giovy", type: ClientType.PIVA } });
  const weroad = await prisma.client.upsert({ where: { name: "WeRoad" }, update: {}, create: { name: "WeRoad", type: ClientType.OCCASIONAL } });

  // ── Asset Categories ────────────────────────────────────────────────────────
  const catLiq   = await prisma.assetCategory.upsert({ where: { name: "liquidity" },      update: {}, create: { name: "liquidity",      displayName: "Liquidità",       displayOrder: 1 } });
  const catEq    = await prisma.assetCategory.upsert({ where: { name: "equity" },          update: {}, create: { name: "equity",          displayName: "Equity",          displayOrder: 2 } });
  const catBond  = await prisma.assetCategory.upsert({ where: { name: "bonds" },           update: {}, create: { name: "bonds",           displayName: "Bonds",           displayOrder: 3 } });
  const catCrypto= await prisma.assetCategory.upsert({ where: { name: "crypto" },          update: {}, create: { name: "crypto",          displayName: "Crypto",          displayOrder: 4 } });
  const catComm  = await prisma.assetCategory.upsert({ where: { name: "commodities" },     update: {}, create: { name: "commodities",     displayName: "Commodities",     displayOrder: 5 } });
  const catPen   = await prisma.assetCategory.upsert({ where: { name: "pension" },         update: {}, create: { name: "pension",         displayName: "Pensione",        displayOrder: 6 } });
  const catOther = await prisma.assetCategory.upsert({ where: { name: "others" },          update: {}, create: { name: "others",          displayName: "Altro",           displayOrder: 7 } });
  const catPE    = await prisma.assetCategory.upsert({ where: { name: "private_equity" },  update: {}, create: { name: "private_equity",  displayName: "Private Equity",  displayOrder: 8 } });

  // ── Asset Items ─────────────────────────────────────────────────────────────
  const ui = async (data: {
    categoryId: string; name: string; broker?: string; isPrivateEquity?: boolean;
    isShares?: boolean; geoAllocUs?: number; geoAllocDevExUs?: number; geoAllocEm?: number; displayOrder?: number;
  }) => {
    const existing = await prisma.assetItem.findFirst({ where: { name: data.name, categoryId: data.categoryId } });
    if (existing) return existing;
    return prisma.assetItem.create({ data });
  };

  const intesa        = await ui({ categoryId: catLiq.id,  name: "Intesa Sanpaolo",         displayOrder: 1 });
  const revolut       = await ui({ categoryId: catLiq.id,  name: "Revolut",                 displayOrder: 2 });
  const revolutJoint  = await ui({ categoryId: catLiq.id,  name: "Revolut Joint (half)",    displayOrder: 3 });
  const satispay      = await ui({ categoryId: catLiq.id,  name: "Satispay",                displayOrder: 4 });
  const cash          = await ui({ categoryId: catLiq.id,  name: "Cash",                    displayOrder: 5 });
  const trCash        = await ui({ categoryId: catLiq.id,  name: "Trade Republic (cash)",   broker: "TR",       displayOrder: 6 });
  const directaCash   = await ui({ categoryId: catLiq.id,  name: "Directa (cash)",          broker: "Directa",  displayOrder: 7 });

  const fondoIntesa   = await ui({ categoryId: catEq.id,  name: "Fondo Intesa",             displayOrder: 1 });
  const moneyfarm47   = await ui({ categoryId: catEq.id,  name: "Moneyfarm 4/7",            displayOrder: 2 });
  const moneyfarm77   = await ui({ categoryId: catEq.id,  name: "Moneyfarm 7/7",            displayOrder: 3 });
  const virginGalactic= await ui({ categoryId: catEq.id,  name: "Virgin Galactic",          displayOrder: 4 });
  const trSP          = await ui({ categoryId: catEq.id,  name: "ETF S&P 500",              broker: "TR",       geoAllocUs: 1.0,  geoAllocDevExUs: 0.0,  geoAllocEm: 0.0,  displayOrder: 5 });
  const trAWexEM      = await ui({ categoryId: catEq.id,  name: "ETF AW ex-EM",             broker: "TR",       geoAllocUs: 0.72, geoAllocDevExUs: 0.28, geoAllocEm: 0.0,  displayOrder: 6 });
  const dirAWexEM     = await ui({ categoryId: catEq.id,  name: "ETF AW ex-EM",             broker: "Directa",  geoAllocUs: 0.72, geoAllocDevExUs: 0.28, geoAllocEm: 0.0,  displayOrder: 7 });
  const trEM          = await ui({ categoryId: catEq.id,  name: "ETF EM",                   broker: "TR",       geoAllocUs: 0.0,  geoAllocDevExUs: 0.0,  geoAllocEm: 1.0,  displayOrder: 8 });
  const dirEM         = await ui({ categoryId: catEq.id,  name: "ETF EM",                   broker: "Directa",  geoAllocUs: 0.0,  geoAllocDevExUs: 0.0,  geoAllocEm: 1.0,  displayOrder: 9 });
  const trAW          = await ui({ categoryId: catEq.id,  name: "ETF All World",            broker: "TR",       geoAllocUs: 0.61, geoAllocDevExUs: 0.29, geoAllocEm: 0.1,  displayOrder: 10 });
  const trDevExUS     = await ui({ categoryId: catEq.id,  name: "ETF Dev ex-US",            broker: "TR",       geoAllocUs: 0.0,  geoAllocDevExUs: 1.0,  geoAllocEm: 0.0,  displayOrder: 11 });
  const trApollo      = await ui({ categoryId: catEq.id,  name: "Apollo Fund",              broker: "TR",       displayOrder: 12 });
  const trEQT         = await ui({ categoryId: catEq.id,  name: "EQT Fund",                 broker: "TR",       displayOrder: 13 });
  const stocks        = await ui({ categoryId: catEq.id,  name: "Stocks",                   displayOrder: 14 });

  const romaniaSept31 = await ui({ categoryId: catBond.id,   name: "Romania Sept 2031",     displayOrder: 1 });
  const romaniaSept29 = await ui({ categoryId: catBond.id,   name: "Romania Sept 2029",     displayOrder: 2 });
  const ethereum      = await ui({ categoryId: catCrypto.id, name: "Ethereum",              displayOrder: 1 });
  const bitcoin       = await ui({ categoryId: catCrypto.id, name: "Bitcoin",               displayOrder: 2 });
  const gold          = await ui({ categoryId: catComm.id,   name: "Gold",                  displayOrder: 1 });
  const silver3x      = await ui({ categoryId: catComm.id,   name: "Silver 3x",             displayOrder: 2 });
  const cometa        = await ui({ categoryId: catPen.id,    name: "Cometa",                displayOrder: 1 });
  const amundiSP      = await ui({ categoryId: catPen.id,    name: "Amundi SP",             displayOrder: 2 });
  const aptDeposit    = await ui({ categoryId: catOther.id,  name: "Deposito appartamento", displayOrder: 1 });
  const dazeItem      = await ui({ categoryId: catPE.id,     name: "Daze",                  isPrivateEquity: true, isShares: true, displayOrder: 1 });

  // ── Historical Net Worth ────────────────────────────────────────────────────
  const nwPeriods = [
    { year: 2021, quarter: 4, v: { [intesa.id]: 6000, [revolut.id]: 0, [revolutJoint.id]: 0, [satispay.id]: 0, [cash.id]: 0, [trCash.id]: 0, [directaCash.id]: 0, [fondoIntesa.id]: 11000, [moneyfarm47.id]: 0, [moneyfarm77.id]: 0, [virginGalactic.id]: 0, [trSP.id]: 0, [trAWexEM.id]: 0, [dirAWexEM.id]: 0, [trEM.id]: 0, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 0, [bitcoin.id]: 0, [gold.id]: 1393, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: null, price: null, val: 0 } },
    { year: 2022, quarter: 1, v: { [intesa.id]: 1900, [revolut.id]: 0, [revolutJoint.id]: 0, [satispay.id]: 0, [cash.id]: 0, [trCash.id]: 0, [directaCash.id]: 0, [fondoIntesa.id]: 11590, [moneyfarm47.id]: 5500, [moneyfarm77.id]: 0, [virginGalactic.id]: 470, [trSP.id]: 0, [trAWexEM.id]: 0, [dirAWexEM.id]: 0, [trEM.id]: 0, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 250, [bitcoin.id]: 0, [gold.id]: 1513, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: null, price: null, val: 0 } },
    { year: 2022, quarter: 2, v: { [intesa.id]: 3830, [revolut.id]: 0, [revolutJoint.id]: 0, [satispay.id]: 70, [cash.id]: 720, [trCash.id]: 0, [directaCash.id]: 0, [fondoIntesa.id]: 10890, [moneyfarm47.id]: 5780, [moneyfarm77.id]: 0, [virginGalactic.id]: 350, [trSP.id]: 0, [trAWexEM.id]: 0, [dirAWexEM.id]: 0, [trEM.id]: 0, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 250, [bitcoin.id]: 0, [gold.id]: 1491, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: null, price: null, val: 0 } },
    { year: 2022, quarter: 3, v: { [intesa.id]: 5800, [revolut.id]: 0, [revolutJoint.id]: 0, [satispay.id]: 60, [cash.id]: 250, [trCash.id]: 0, [directaCash.id]: 0, [fondoIntesa.id]: 10720, [moneyfarm47.id]: 7560, [moneyfarm77.id]: 0, [virginGalactic.id]: 290, [trSP.id]: 0, [trAWexEM.id]: 0, [dirAWexEM.id]: 0, [trEM.id]: 0, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 420, [bitcoin.id]: 0, [gold.id]: 1462, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: null, price: null, val: 0 } },
    { year: 2022, quarter: 4, v: { [intesa.id]: 8300, [revolut.id]: 0, [revolutJoint.id]: 0, [satispay.id]: 90, [cash.id]: 50, [trCash.id]: 0, [directaCash.id]: 0, [fondoIntesa.id]: 10700, [moneyfarm47.id]: 8230, [moneyfarm77.id]: 0, [virginGalactic.id]: 180, [trSP.id]: 0, [trAWexEM.id]: 0, [dirAWexEM.id]: 0, [trEM.id]: 0, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 540, [bitcoin.id]: 0, [gold.id]: 1478, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: null, price: null, val: 0 } },
    { year: 2023, quarter: 1, v: { [intesa.id]: 6850, [revolut.id]: 180, [revolutJoint.id]: 0, [satispay.id]: 50, [cash.id]: 400, [trCash.id]: 0, [directaCash.id]: 0, [fondoIntesa.id]: 10900, [moneyfarm47.id]: 11180, [moneyfarm77.id]: 0, [virginGalactic.id]: 200, [trSP.id]: 0, [trAWexEM.id]: 0, [dirAWexEM.id]: 0, [trEM.id]: 0, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 950, [bitcoin.id]: 0, [gold.id]: 1562, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: 3.57, price: 1450, val: 3.57 * 1450 } },
    { year: 2023, quarter: 2, v: { [intesa.id]: 6250, [revolut.id]: 90, [revolutJoint.id]: 0, [satispay.id]: 70, [cash.id]: 720, [trCash.id]: 0, [directaCash.id]: 0, [fondoIntesa.id]: 10900, [moneyfarm47.id]: 11370, [moneyfarm77.id]: 4980, [virginGalactic.id]: 180, [trSP.id]: 0, [trAWexEM.id]: 0, [dirAWexEM.id]: 0, [trEM.id]: 0, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 1050, [bitcoin.id]: 0, [gold.id]: 1514, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: 3.57, price: 1450, val: 3.57 * 1450 } },
    { year: 2023, quarter: 3, v: { [intesa.id]: 7100, [revolut.id]: 450, [revolutJoint.id]: 0, [satispay.id]: 60, [cash.id]: 250, [trCash.id]: 0, [directaCash.id]: 0, [fondoIntesa.id]: 10750, [moneyfarm47.id]: 11250, [moneyfarm77.id]: 5000, [virginGalactic.id]: 100, [trSP.id]: 0, [trAWexEM.id]: 0, [dirAWexEM.id]: 0, [trEM.id]: 0, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 900, [bitcoin.id]: 0, [gold.id]: 1485, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: 3.57, price: 1450, val: 3.57 * 1450 } },
    { year: 2023, quarter: 4, v: { [intesa.id]: 10750, [revolut.id]: 600, [revolutJoint.id]: 0, [satispay.id]: 90, [cash.id]: 50, [trCash.id]: 0, [directaCash.id]: 0, [fondoIntesa.id]: 11250, [moneyfarm47.id]: 11750, [moneyfarm77.id]: 5250, [virginGalactic.id]: 150, [trSP.id]: 0, [trAWexEM.id]: 0, [dirAWexEM.id]: 0, [trEM.id]: 0, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 1300, [bitcoin.id]: 0, [gold.id]: 1599, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: 3.57, price: 1450, val: 3.57 * 1450 } },
    { year: 2024, quarter: 1, v: { [intesa.id]: 500, [revolut.id]: 1190, [revolutJoint.id]: 0, [satispay.id]: 60, [cash.id]: 130, [trCash.id]: 15900, [directaCash.id]: 0, [fondoIntesa.id]: 0, [moneyfarm47.id]: 12230, [moneyfarm77.id]: 8880, [virginGalactic.id]: 80, [trSP.id]: 900, [trAWexEM.id]: 2200, [dirAWexEM.id]: 0, [trEM.id]: 310, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 1470, [bitcoin.id]: 0, [gold.id]: 1657, [silver3x.id]: 0, [cometa.id]: 0, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: 5.76, price: 1450, val: 5.76 * 1450 } },
    { year: 2024, quarter: 2, v: { [intesa.id]: 10, [revolut.id]: 760, [revolutJoint.id]: 0, [satispay.id]: 20, [cash.id]: 350, [trCash.id]: 13380, [directaCash.id]: 0, [fondoIntesa.id]: 0, [moneyfarm47.id]: 12350, [moneyfarm77.id]: 9120, [virginGalactic.id]: 30, [trSP.id]: 2970, [trAWexEM.id]: 8560, [dirAWexEM.id]: 0, [trEM.id]: 1260, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 0, [bitcoin.id]: 0, [gold.id]: 1862, [silver3x.id]: 0, [cometa.id]: 900, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: 5.76, price: 1450, val: 5.76 * 1450 } },
    { year: 2024, quarter: 3, v: { [intesa.id]: 10, [revolut.id]: 540, [revolutJoint.id]: 0, [satispay.id]: 30, [cash.id]: 400, [trCash.id]: 24500, [directaCash.id]: 0, [fondoIntesa.id]: 0, [moneyfarm47.id]: 0, [moneyfarm77.id]: 0, [virginGalactic.id]: 20, [trSP.id]: 6750, [trAWexEM.id]: 16160, [dirAWexEM.id]: 0, [trEM.id]: 2580, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 0, [bitcoin.id]: 0, [gold.id]: 2017, [silver3x.id]: 0, [cometa.id]: 1800, [amundiSP.id]: 0, [aptDeposit.id]: 0 }, pe: { shares: 5.76, price: 1450, val: 5.76 * 1450 } },
    { year: 2024, quarter: 4, v: { [intesa.id]: 10, [revolut.id]: 1950, [revolutJoint.id]: 0, [satispay.id]: 110, [cash.id]: 210, [trCash.id]: 14040, [directaCash.id]: 0, [fondoIntesa.id]: 0, [moneyfarm47.id]: 0, [moneyfarm77.id]: 0, [virginGalactic.id]: 10, [trSP.id]: 11000, [trAWexEM.id]: 23100, [dirAWexEM.id]: 0, [trEM.id]: 3530, [dirEM.id]: 0, [trAW.id]: 0, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 930, [romaniaSept31.id]: 0, [romaniaSept29.id]: 0, [ethereum.id]: 0, [bitcoin.id]: 0, [gold.id]: 2157, [silver3x.id]: 0, [cometa.id]: 1900, [amundiSP.id]: 1000, [aptDeposit.id]: 0 }, pe: { shares: 9.03, price: 1450, val: 9.03 * 1450 } },
    { year: 2025, quarter: 1, v: { [intesa.id]: 10, [revolut.id]: 1430, [revolutJoint.id]: 58, [satispay.id]: 73, [cash.id]: 150, [trCash.id]: 22340, [directaCash.id]: 0, [fondoIntesa.id]: 0, [moneyfarm47.id]: 0, [moneyfarm77.id]: 0, [virginGalactic.id]: 5, [trSP.id]: 11050, [trAWexEM.id]: 24755, [dirAWexEM.id]: 0, [trEM.id]: 3888, [dirEM.id]: 0, [trAW.id]: 3240, [trDevExUS.id]: 0, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 1230, [romaniaSept31.id]: 5050, [romaniaSept29.id]: 2500, [ethereum.id]: 0, [bitcoin.id]: 0, [gold.id]: 2410, [silver3x.id]: 0, [cometa.id]: 3050, [amundiSP.id]: 950, [aptDeposit.id]: 1600 }, pe: { shares: 12.75, price: 1450, val: 12.75 * 1450 } },
    { year: 2025, quarter: 2, v: { [intesa.id]: 10, [revolut.id]: 1070, [revolutJoint.id]: 95, [satispay.id]: 50, [cash.id]: 600, [trCash.id]: 14610, [directaCash.id]: 0, [fondoIntesa.id]: 0, [moneyfarm47.id]: 0, [moneyfarm77.id]: 0, [virginGalactic.id]: 5, [trSP.id]: 6734, [trAWexEM.id]: 31870, [dirAWexEM.id]: 0, [trEM.id]: 5184, [dirEM.id]: 0, [trAW.id]: 5576, [trDevExUS.id]: 5487, [trApollo.id]: 0, [trEQT.id]: 0, [stocks.id]: 0, [romaniaSept31.id]: 5080, [romaniaSept29.id]: 2530, [ethereum.id]: 0, [bitcoin.id]: 0, [gold.id]: 2808, [silver3x.id]: 0, [cometa.id]: 3200, [amundiSP.id]: 1000, [aptDeposit.id]: 1600 }, pe: { shares: 12.69, price: 1450, val: 12.69 * 1450 } },
    { year: 2025, quarter: 3, v: { [intesa.id]: 10, [revolut.id]: 1260, [revolutJoint.id]: 750, [satispay.id]: 20, [cash.id]: 520, [trCash.id]: 11100, [directaCash.id]: 0, [fondoIntesa.id]: 0, [moneyfarm47.id]: 0, [moneyfarm77.id]: 0, [virginGalactic.id]: 5, [trSP.id]: 7040, [trAWexEM.id]: 37040, [dirAWexEM.id]: 0, [trEM.id]: 6220, [dirEM.id]: 0, [trAW.id]: 5880, [trDevExUS.id]: 5900, [trApollo.id]: 1515, [trEQT.id]: 1580, [stocks.id]: 140, [romaniaSept31.id]: 4910, [romaniaSept29.id]: 4900, [ethereum.id]: 0, [bitcoin.id]: 530, [gold.id]: 4415, [silver3x.id]: 0, [cometa.id]: 3200, [amundiSP.id]: 1000, [aptDeposit.id]: 1600 }, pe: { shares: 12.69, price: 1450, val: 12.69 * 1450 } },
    { year: 2025, quarter: 4, v: { [intesa.id]: 2, [revolut.id]: 750, [revolutJoint.id]: 70, [satispay.id]: 10, [cash.id]: 450, [trCash.id]: 8000, [directaCash.id]: 820, [fondoIntesa.id]: 0, [moneyfarm47.id]: 0, [moneyfarm77.id]: 0, [virginGalactic.id]: 5, [trSP.id]: 6930, [trAWexEM.id]: 38920, [dirAWexEM.id]: 1009, [trEM.id]: 6970, [dirEM.id]: 166, [trAW.id]: 7880, [trDevExUS.id]: 6030, [trApollo.id]: 1525, [trEQT.id]: 1590, [stocks.id]: 140, [romaniaSept31.id]: 4955, [romaniaSept29.id]: 4958, [ethereum.id]: 0, [bitcoin.id]: 440, [gold.id]: 6019, [silver3x.id]: 0, [cometa.id]: 3200, [amundiSP.id]: 1000, [aptDeposit.id]: 1600 }, pe: { shares: 23.21, price: 1450, val: 23.21 * 1450 } },
    { year: 2026, quarter: 1, v: { [intesa.id]: 10, [revolut.id]: 9175, [revolutJoint.id]: 280, [satispay.id]: 10, [cash.id]: 100, [trCash.id]: 5068, [directaCash.id]: 620, [fondoIntesa.id]: 0, [moneyfarm47.id]: 0, [moneyfarm77.id]: 0, [virginGalactic.id]: 0, [trSP.id]: 7497, [trAWexEM.id]: 41520, [dirAWexEM.id]: 2100, [trEM.id]: 7900, [dirEM.id]: 355, [trAW.id]: 8464, [trDevExUS.id]: 6230, [trApollo.id]: 1545, [trEQT.id]: 1610, [stocks.id]: 130, [romaniaSept31.id]: 4996, [romaniaSept29.id]: 5002, [ethereum.id]: 0, [bitcoin.id]: 470, [gold.id]: 5880, [silver3x.id]: 0, [cometa.id]: 3200, [amundiSP.id]: 1000, [aptDeposit.id]: 1600 }, pe: { shares: 23.21, price: 1450, val: 23.21 * 1450 } },
  ];

  for (const p of nwPeriods) {
    const existing = await prisma.netWorthPeriod.findUnique({ where: { year_quarter: { year: p.year, quarter: p.quarter } } });
    if (existing) continue;
    const period = await prisma.netWorthPeriod.create({ data: { year: p.year, quarter: p.quarter } });
    const entries = Object.entries(p.v).map(([assetItemId, value]) => ({ periodId: period.id, assetItemId, value: value as number }));
    entries.push({ periodId: period.id, assetItemId: dazeItem.id, value: p.pe.val, ...(p.pe.shares ? { shares: p.pe.shares, pricePerShare: p.pe.price } : {}) } as any);
    await prisma.netWorthValue.createMany({ data: entries as any });
  }

  // ── Invoices ────────────────────────────────────────────────────────────────
  const invoices = [
    { year: 2025, invoiceNumber: "1",  date: "2025-03-28", clientId: giovy.id, amount: 9380,                        amountAccrued: 0 },
    { year: 2025, invoiceNumber: "2",  date: "2025-04-28", clientId: daze.id,  amount: 9380,                        amountAccrued: 4500 },
    { year: 2025, invoiceNumber: "3",  date: "2025-05-08", clientId: giovy.id, amount: 4588.8,                      amountAccrued: 4500 },
    { year: 2025, invoiceNumber: "4",  date: "2025-05-29", clientId: daze.id,  amount: 4434.37,                     amountAccrued: 0 },
    { year: 2025, invoiceNumber: "5",  date: "2025-06-30", clientId: giovy.id, amount: 53000 / 12,                  amountAccrued: 0 },
    { year: 2025, invoiceNumber: "6",  date: "2025-07-31", clientId: daze.id,  amount: 4417 - 1025,                 amountAccrued: 0 },
    { year: 2025, invoiceNumber: "7",  date: "2025-08-06", clientId: giovy.id, amount: 4220,                        amountAccrued: 2500 },
    { year: 2025, invoiceNumber: "8",  date: "2025-08-27", clientId: daze.id,  amount: 53000 / 12 + 25,             amountAccrued: 0 },
    { year: 2025, invoiceNumber: "-",  date: "2025-09-20", clientId: weroad.id,amount: 200,                         amountAccrued: 0 },
    { year: 2025, invoiceNumber: "9",  date: "2025-09-26", clientId: giovy.id, amount: 53000 / 12 + 172.84,         amountAccrued: 0 },
    { year: 2025, invoiceNumber: "10", date: "2025-10-27", clientId: giovy.id, amount: 53000 / 12 + 263.92,         amountAccrued: 0 },
    { year: 2025, invoiceNumber: "11", date: "2025-11-05", clientId: daze.id,  amount: 3711.11,                     amountAccrued: 3000 },
    { year: 2025, invoiceNumber: "12", date: "2025-11-27", clientId: daze.id,  amount: 53000 / 12 + 97.32,          amountAccrued: 0 },
    { year: 2025, invoiceNumber: "13", date: "2025-12-15", clientId: giovy.id, amount: 4417,                        amountAccrued: 0 },
    { year: 2026, invoiceNumber: "-",  date: "2026-01-23", clientId: weroad.id,amount: 660,                         amountAccrued: 0 },
    { year: 2026, invoiceNumber: "1",  date: "2026-01-31", clientId: giovy.id, amount: 53000 / 12 + 111.32 + 5175.22, amountAccrued: 3000 },
    { year: 2026, invoiceNumber: "2",  date: "2026-02-28", clientId: daze.id,  amount: 53000 / 12 + 169.65,         amountAccrued: 1500 },
    { year: 2026, invoiceNumber: "3",  date: "2026-04-02", clientId: giovy.id, amount: 53000 / 12 + 14 + 29 + 17.8 + 5.4, amountAccrued: 1500 },
    { year: 2026, invoiceNumber: "4",  date: "2026-05-04", clientId: daze.id,  amount: 5500 + 36.3,                 amountAccrued: 1500 },
    { year: 2026, invoiceNumber: "5",  date: "2026-05-07", clientId: giovy.id, amount: 3664.42,                     amountAccrued: 0 },
  ];

  for (const inv of invoices) {
    const existing = await prisma.invoice.findFirst({ where: { year: inv.year, invoiceNumber: inv.invoiceNumber, clientId: inv.clientId } });
    if (!existing) await prisma.invoice.create({ data: { ...inv, date: new Date(inv.date) } });
  }

  return NextResponse.json({ success: true, message: "Database seeded successfully" });
}
