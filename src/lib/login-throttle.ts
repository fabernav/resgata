import { prisma } from "@/lib/prisma";

// Depois de MAX_TENTATIVAS senhas erradas seguidas, o login daquele e-mail
// fica travado por TEMPO_BLOQUEIO_SEGUNDOS. Ao destravar, o contador zera.

function getMaxTentativas(): number {
  const parsed = Number(process.env.LOGIN_MAX_ATTEMPTS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

export const TEMPO_BLOQUEIO_SEGUNDOS = 60;

// Quantos segundos faltam para o e-mail poder tentar de novo (0 = liberado).
export async function segundosDeBloqueio(email: string): Promise<number> {
  const registro = await prisma.loginThrottle.findUnique({ where: { email } });
  if (!registro?.lockedUntil) return 0;

  const restante = Math.ceil((registro.lockedUntil.getTime() - Date.now()) / 1000);
  return restante > 0 ? restante : 0;
}

export interface ResultadoFalha {
  tentativasRestantes: number;
  bloqueadoPorSegundos: number;
}

export async function registrarFalha(email: string): Promise<ResultadoFalha> {
  const max = getMaxTentativas();

  // "increment" e atomico no banco: duas tentativas ao mesmo tempo nao se perdem.
  const registro = await prisma.loginThrottle.upsert({
    where: { email },
    create: { email, failures: 1 },
    update: { failures: { increment: 1 }, lockedUntil: null },
  });

  if (registro.failures >= max) {
    await prisma.loginThrottle.update({
      where: { email },
      data: {
        failures: 0,
        lockedUntil: new Date(Date.now() + TEMPO_BLOQUEIO_SEGUNDOS * 1000),
      },
    });
    return { tentativasRestantes: 0, bloqueadoPorSegundos: TEMPO_BLOQUEIO_SEGUNDOS };
  }

  return { tentativasRestantes: max - registro.failures, bloqueadoPorSegundos: 0 };
}

export async function limparFalhas(email: string): Promise<void> {
  await prisma.loginThrottle.deleteMany({ where: { email } });
}
