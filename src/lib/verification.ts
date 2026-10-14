import { prisma } from "@/lib/prisma";
import { compararRespostas } from "@/lib/answer-matching";

function getMaxAttempts(): number {
  const raw = process.env.MAX_VERIFICATION_ATTEMPTS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : 3;
}

export class VerificationError extends Error {
  constructor(
    message: string,
    public code: "MATCH_NOT_FOUND" | "ALREADY_BLOCKED" | "ALREADY_VERIFIED" | "FORBIDDEN",
  ) {
    super(message);
  }
}

export interface VerificationResult {
  success: boolean;
  attemptsRemaining: number;
  status: "VERIFIED" | "BLOCKED" | "SUGGESTED";
}

// Apos MAX_VERIFICATION_ATTEMPTS falhas consecutivas, o match e bloqueado.
export async function attemptVerification(matchId: string, answer: string): Promise<VerificationResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { foundItem: true, attempts: true },
  });

  if (!match) {
    throw new VerificationError("Match nao encontrado", "MATCH_NOT_FOUND");
  }
  if (match.status === "BLOCKED") {
    throw new VerificationError("Numero maximo de tentativas excedido", "ALREADY_BLOCKED");
  }
  if (match.status === "VERIFIED" || match.status === "RESOLVED") {
    throw new VerificationError("Este match ja foi verificado", "ALREADY_VERIFIED");
  }

  const maxAttempts = getMaxAttempts();
  const failedSoFar = match.attempts.filter((a) => !a.success).length;

  const { aprovado: isCorrect } = compararRespostas(
    answer,
    match.foundItem.secretAnswer,
    match.foundItem.secretQuestion,
  );

  await prisma.verificationAttempt.create({
    data: { matchId, success: isCorrect },
  });

  if (isCorrect) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "VERIFIED" },
    });
    return { success: true, attemptsRemaining: maxAttempts - failedSoFar, status: "VERIFIED" };
  }

  const failedNow = failedSoFar + 1;
  const attemptsRemaining = Math.max(0, maxAttempts - failedNow);

  if (failedNow >= maxAttempts) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "BLOCKED" },
    });
    return { success: false, attemptsRemaining: 0, status: "BLOCKED" };
  }

  return { success: false, attemptsRemaining, status: "SUGGESTED" };
}

export async function getVerificationQuestion(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { foundItem: true, attempts: true },
  });

  if (!match) {
    throw new VerificationError("Match nao encontrado", "MATCH_NOT_FOUND");
  }

  const maxAttempts = getMaxAttempts();
  const failedSoFar = match.attempts.filter((a) => !a.success).length;

  return {
    question: match.foundItem.secretQuestion,
    status: match.status,
    attemptsRemaining: Math.max(0, maxAttempts - failedSoFar),
  };
}

// Devolve sempre o contato da OUTRA parte, nunca o de quem esta olhando.
export async function getReleasedContact(matchId: string, viewerId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      foundItem: { include: { user: true } },
      lostItem: { include: { user: true } },
    },
  });

  if (!match) return null;

  if (match.status !== "VERIFIED" && match.status !== "RESOLVED") {
    return null;
  }

  const souODono = match.lostItem.userId === viewerId;
  const souQuemAchou = match.foundItem.userId === viewerId;
  if (!souODono && !souQuemAchou) return null;

  const outraParte = souODono ? match.foundItem.user : match.lostItem.user;

  return {
    name: outraParte.name,
    email: outraParte.email,
    phone: outraParte.phone,
    papel: souODono ? ("ACHOU" as const) : ("PERDEU" as const),
  };
}
