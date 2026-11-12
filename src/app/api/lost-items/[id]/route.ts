import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { lostItemSchema } from "@/lib/validators";
import { editarItemPerdido, excluirItemPerdido, ItemError } from "@/lib/item-management";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = lostItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const { item, motor } = await editarItemPerdido(params.id, session.userId, parsed.data);
    return NextResponse.json({ item, motor });
  } catch (err) {
    if (err instanceof ItemError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  try {
    await excluirItemPerdido(params.id, session.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ItemError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
