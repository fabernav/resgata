import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { foundItemSchema } from "@/lib/validators";
import { editarItemAchado, excluirItemAchado, ItemError } from "@/lib/item-management";
import { toPublicFoundItem } from "@/lib/serializers";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = foundItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const { item, motor } = await editarItemAchado(params.id, session.userId, parsed.data);
    // Mesmo para o dono, a resposta nao carrega pergunta/resposta secretas.
    return NextResponse.json({ item: toPublicFoundItem(item), motor });
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
    await excluirItemAchado(params.id, session.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ItemError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
