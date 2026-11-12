import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getReleasedContact } from "@/lib/verification";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
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
  const isParticipant = match.lostItem.userId === session.userId || match.foundItem.userId === session.userId;
  if (!isParticipant) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
  }

  const contact = await getReleasedContact(params.id, session.userId);
  if (!contact) {
    return NextResponse.json({ error: "Match ainda nao verificado" }, { status: 403 });
  }

  const souODono = match.lostItem.userId === session.userId;
  return NextResponse.json({
    contact,
    photoUrl: match.foundItem.photoUrl,
    confirmacao: {
      euConfirmei: souODono ? match.lostConfirmedDelivery : match.foundConfirmedDelivery,
      outroConfirmou: souODono ? match.foundConfirmedDelivery : match.lostConfirmedDelivery,
      resolvido: match.status === "RESOLVED",
    },
  });
}
