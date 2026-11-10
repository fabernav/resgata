import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { limparFalhas, registrarFalha, segundosDeBloqueio } from "@/lib/login-throttle";

function respostaBloqueado(segundos: number) {
  return NextResponse.json(
    {
      error: `Muitas tentativas erradas. Aguarde ${segundos}s para tentar de novo.`,
      retryAfter: segundos,
    },
    { status: 429, headers: { "Retry-After": String(segundos) } },
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Checa o bloqueio ANTES de conferir a senha: travado, nem a senha certa entra.
  const espera = await segundosDeBloqueio(email);
  if (espera > 0) {
    return respostaBloqueado(espera);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    // Conta a falha mesmo se o e-mail nao existir, para nao revelar quem tem conta.
    const falha = await registrarFalha(email);
    if (falha.bloqueadoPorSegundos > 0) {
      return respostaBloqueado(falha.bloqueadoPorSegundos);
    }
    return NextResponse.json(
      {
        error: `E-mail ou senha incorretos. ${falha.tentativasRestantes} tentativa(s) antes do bloqueio de 1 minuto.`,
        attemptsRemaining: falha.tentativasRestantes,
      },
      { status: 401 },
    );
  }

  await limparFalhas(email);
  await createSession({ userId: user.id, email: user.email });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
