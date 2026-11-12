import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verificationAnswerSchema } from "@/lib/validators";
import { attemptVerification, getVerificationQuestion, VerificationError } from "@/lib/verification";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: { lostItem: true },
  });
  if (!match) {
    return NextResponse.json({ error: "Match nao encontrado" }, { status: 404 });
  }
  if (match.lostItem.userId !== session.userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
  }

  const data = await getVerificationQuestion(params.id);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: { lostItem: true },
  });
  if (!match) {
    return NextResponse.json({ error: "Match nao encontrado" }, { status: 404 });
  }
  if (match.lostItem.userId !== session.userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = verificationAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await attemptVerification(params.id, parsed.data.answer);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof VerificationError) {
      const statusByCode = { MATCH_NOT_FOUND: 404, ALREADY_BLOCKED: 403, ALREADY_VERIFIED: 409, FORBIDDEN: 403 } as const;
      return NextResponse.json({ error: err.message }, { status: statusByCode[err.code] });
    }
    throw err;
  }
}
