import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validators";
import { redefinirSenha, ResetError } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    await redefinirSenha(parsed.data.token, parsed.data.password);
  } catch (err) {
    if (err instanceof ResetError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  return NextResponse.json({ message: "Senha redefinida. Ja pode entrar com a nova senha." });
}
