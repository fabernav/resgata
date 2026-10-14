import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: { lostItem: true, foundItem: true },
  });
  if (!match) {
    return NextResponse.json({ error: "Match nao encontrado" }, { status: 404 });
  }
  if (match.status !== "VERIFIED" && match.status !== "RESOLVED") {
    return NextResponse.json({ error: "Match ainda nao verificado" }, { status: 403 });
  }

  const isLostOwner = match.lostItem.userId === session.userId;
  const isFoundOwner = match.foundItem.userId === session.userId;
  if (!isLostOwner && !isFoundOwner) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
  }

  const lostConfirmedDelivery = isLostOwner ? true : match.lostConfirmedDelivery;
  const foundConfirmedDelivery = isFoundOwner ? true : match.foundConfirmedDelivery;
  const bothConfirmed = lostConfirmedDelivery && foundConfirmedDelivery;

  const updated = await prisma.match.update({
    where: { id: params.id },
    data: {
      lostConfirmedDelivery,
      foundConfirmedDelivery,
      status: bothConfirmed ? "RESOLVED" : match.status,
    },
  });

  if (bothConfirmed) {
    await prisma.lostItem.update({ where: { id: match.lostItemId }, data: { status: "RESOLVED" } });
    await prisma.foundItem.update({ where: { id: match.foundItemId }, data: { status: "RESOLVED" } });
  }

  return NextResponse.json({
    confirmacao: {
      euConfirmei: true,
      outroConfirmou: isLostOwner ? foundConfirmedDelivery : lostConfirmedDelivery,
      resolvido: updated.status === "RESOLVED",
    },
  });
}
