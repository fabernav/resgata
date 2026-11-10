import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";
import { criarTokenDeReset, VALIDADE_LINK_MINUTOS } from "@/lib/password-reset";
import { enviarEmail } from "@/lib/email";

// A resposta e SEMPRE a mesma, exista a conta ou nao. Assim ninguem usa esta
// tela para descobrir quais e-mails estao cadastrados.
const RESPOSTA_PADRAO = {
  message: "Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha.",
};

// APP_URL (ex: https://resgata.vercel.app) evita que um cabecalho "Host"
// forjado gere um link apontando para outro site.
function urlBase(request: NextRequest): string {
  return process.env.APP_URL?.replace(/\/$/, "") || request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json(RESPOSTA_PADRAO);
  }

  const token = await criarTokenDeReset(user.id);
  if (!token) {
    return NextResponse.json(RESPOSTA_PADRAO);
  }

  const link = `${urlBase(request)}/reset-password?token=${token}`;
  const primeiroNome = user.name.split(" ")[0] ?? user.name;
  // O nome vem do cadastro: escapa antes de colocar no HTML do e-mail.
  const nomeHtml = primeiroNome.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  try {
    await enviarEmail(
      user.email,
      "Resgata - Redefinir sua senha",
      `Ola, ${primeiroNome}!\n\nPara criar uma nova senha, abra o link abaixo (vale por ${VALIDADE_LINK_MINUTOS} minutos):\n${link}\n\nSe nao foi voce que pediu, ignore este e-mail.`,
      `<p>Ola, ${nomeHtml}!</p>
       <p>Para criar uma nova senha, clique no botao abaixo. O link vale por ${VALIDADE_LINK_MINUTOS} minutos.</p>
       <p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#0071E3;color:#fff;border-radius:999px;text-decoration:none">Redefinir senha</a></p>
       <p style="color:#86868B;font-size:12px">Se nao foi voce que pediu, ignore este e-mail.</p>`,
    );
  } catch (err) {
    console.error("[forgot-password] falha ao enviar e-mail:", err);
    // O link nunca chegou: apaga o token para a pessoa poder pedir de novo na
    // hora (senao a regra de "1 pedido por minuto" pularia o proximo envio).
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    return NextResponse.json(
      { error: "Nao foi possivel enviar o e-mail agora. Tente novamente em alguns minutos." },
      { status: 502 },
    );
  }

  return NextResponse.json(RESPOSTA_PADRAO);
}
