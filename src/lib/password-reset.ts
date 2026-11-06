import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { limparFalhas } from "@/lib/login-throttle";

export const VALIDADE_LINK_MINUTOS = 30;

// Evita que alguem dispare dezenas de e-mails para a mesma pessoa.
const INTERVALO_MINIMO_SEGUNDOS = 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Cria um token novo e devolve o valor "cru" (vai so no link do e-mail).
// Retorna null se ja foi pedido um link ha menos de 1 minuto.
export async function criarTokenDeReset(userId: string): Promise<string | null> {
  const recente = await prisma.passwordResetToken.findFirst({
    where: {
      userId,
      createdAt: { gt: new Date(Date.now() - INTERVALO_MINIMO_SEGUNDOS * 1000) },
    },
  });
  if (recente) return null;

  // Um link novo invalida os anteriores.
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VALIDADE_LINK_MINUTOS * 60 * 1000),
    },
  });
  return token;
}

export class ResetError extends Error {}

export async function redefinirSenha(token: string, novaSenha: string): Promise<void> {
  const registro = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!registro || registro.usedAt || registro.expiresAt < new Date()) {
    throw new ResetError("Este link e invalido ou expirou. Peca um novo.");
  }

  // Marca como usado so se ainda nao estava: se o link for aberto duas vezes
  // ao mesmo tempo, apenas um dos pedidos troca a senha.
  const marcado = await prisma.passwordResetToken.updateMany({
    where: { id: registro.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (marcado.count === 0) {
    throw new ResetError("Este link ja foi usado. Peca um novo.");
  }

  await prisma.user.update({
    where: { id: registro.userId },
    data: { password: await hashPassword(novaSenha) },
  });

  // Quem trocou a senha nao deve continuar travado no login.
  await limparFalhas(registro.user.email);
}
