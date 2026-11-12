import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { foundItemSchema } from "@/lib/validators";
import { runMatchingForFoundItem } from "@/lib/matching";
import { toPublicFoundItemList } from "@/lib/serializers";

export async function GET() {
  const items = await prisma.foundItem.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: toPublicFoundItemList(items) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = foundItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const item = await prisma.foundItem.create({
    data: { ...parsed.data, userId: session.userId },
  });

  const motor = await runMatchingForFoundItem(item);

  return NextResponse.json({ item, motor }, { status: 201 });
}
