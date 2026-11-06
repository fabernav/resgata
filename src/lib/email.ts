import nodemailer from "nodemailer";

// Envio de e-mail. Tres modos, nesta ordem de preferencia (ver .env.example):
//
//  1. Resend (RESEND_API_KEY): envia por HTTPS, o mesmo caminho dos sites.
//     Funciona ate em redes que bloqueiam e-mail (faculdade, alguns roteadores).
//  2. SMTP (SMTP_HOST/USER/PASS): Gmail com "senha de app", Outlook etc.
//  3. Nada configurado: o e-mail NAO e enviado; o conteudo aparece no terminal
//     do `npm run dev`, para ainda dar para testar o fluxo.

export async function enviarEmail(para: string, assunto: string, texto: string, html: string) {
  if (process.env.RESEND_API_KEY) {
    return enviarPorResend(para, assunto, texto, html);
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return enviarPorSmtp(para, assunto, texto, html);
  }

  console.log("\n[email] Envio de e-mail nao configurado. E-mail que seria enviado:");
  console.log(`  Para: ${para}\n  Assunto: ${assunto}\n\n${texto}\n`);
}

async function enviarPorResend(para: string, assunto: string, texto: string, html: string) {
  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Sem dominio proprio verificado no Resend, o remetente tem que ser este.
      from: process.env.RESEND_FROM || "Resgata <onboarding@resend.dev>",
      to: [para],
      subject: assunto,
      text: texto,
      html,
    }),
  });

  if (!resposta.ok) {
    throw new Error(`Resend recusou o envio (${resposta.status}): ${await resposta.text()}`);
  }
}

async function enviarPorSmtp(para: string, assunto: string, texto: string, html: string) {
  const porta = Number(process.env.SMTP_PORT) || 465;
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    secure: porta === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporte.sendMail({
    from: process.env.EMAIL_FROM || `Resgata <${process.env.SMTP_USER}>`,
    to: para,
    subject: assunto,
    text: texto,
    html,
  });
}
