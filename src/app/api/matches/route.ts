import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ lostItem: { userId: session.userId } }, { foundItem: { userId: session.userId } }],
    },
    include: {
      lostItem: true,
      foundItem: {
        select: {
          id: true,
          category: true,
          color: true,
          location: true,
          foundDate: true,
          description: true,
          photoUrl: true,
          status: true,
          userId: true,
          // secretQuestion e secretAnswer deliberadamente omitidos
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ matches });
}
