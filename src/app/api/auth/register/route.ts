import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-mail ja cadastrado" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { name, email, phone, password: await hashPassword(password) },
  });

  await createSession({ userId: user.id, email: user.email });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
