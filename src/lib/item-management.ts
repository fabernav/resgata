import { prisma } from "@/lib/prisma";
import type { FoundItem, LostItem, Match } from "@prisma/client";
import {
  calculateMatchScore,
  getMinScore,
  runMatchingForFoundItem,
  runMatchingForLostItem,
  type ResultadoDoMotor,
} from "@/lib/matching";
import type { FoundItemInput, LostItemInput } from "@/lib/validators";

// Regras para editar/excluir um item:
//  - so o dono do item;
//  - nao pode se ja foi devolvido (RESOLVED): faz parte do historico das duas pessoas;
//  - nao pode se tem match VERIFIED: o contato ja foi liberado e a devolucao esta em andamento.
//
// Cuidado com a protecao contra forca bruta: um match que ja teve tentativa de
// verificacao NUNCA e apagado por uma edicao, e a exclusao de um item perdido
// nao "libera" o item achado do outro lado. Sem isso, bastaria apagar e
// recadastrar o item perdido para ganhar 3 tentativas novas.

export class ItemError extends Error {
  constructor(
    message: string,
    public status: 400 | 403 | 404 | 409,
  ) {
    super(message);
  }
}

type ComMatches = { userId: string; status: string; matches: Match[] };

export function motivoDeTrava(item: { status: string; matches: { status: string }[] }): string | null {
  if (item.status === "RESOLVED") {
    return "Este item ja foi devolvido e faz parte do historico.";
  }
  if (item.matches.some((m) => m.status === "VERIFIED")) {
    return "Este item tem uma devolucao em andamento (o contato ja foi liberado). Combine com a outra pessoa e confirme a entrega.";
  }
  return null;
}

function conferirPermissao<T extends ComMatches>(item: T | null, userId: string): T {
  if (!item) throw new ItemError("Item nao encontrado", 404);
  if (item.userId !== userId) throw new ItemError("Nao autorizado", 403);
  const trava = motivoDeTrava(item);
  if (trava) throw new ItemError(trava, 409);
  return item;
}

// Um item fica MATCHED enquanto tiver qualquer match nao resolvido
// (sugerido, verificado ou bloqueado) e volta a ficar livre quando nao tiver nenhum.
async function recalcularStatusPerdido(id: string) {
  const item = await prisma.lostItem.findUnique({ where: { id }, include: { matches: true } });
  if (!item || item.status === "RESOLVED") return;
  const temMatch = item.matches.some((m) => m.status !== "RESOLVED");
  await prisma.lostItem.update({ where: { id }, data: { status: temMatch ? "MATCHED" : "PENDING_MATCH" } });
}

async function recalcularStatusAchado(id: string) {
  const item = await prisma.foundItem.findUnique({ where: { id }, include: { matches: true } });
  if (!item || item.status === "RESOLVED") return;
  const temMatch = item.matches.some((m) => m.status !== "RESOLVED");
  await prisma.foundItem.update({ where: { id }, data: { status: temMatch ? "MATCHED" : "AVAILABLE" } });
}

async function teveTentativas(matchId: string): Promise<boolean> {
  return (await prisma.verificationAttempt.count({ where: { matchId } })) > 0;
}

// Depois de editar, um match sugerido pode nao fazer mais sentido (ex: mudou a
// categoria). Se ninguem tentou verificar ainda, ele sai; senao so atualiza a nota.
async function revisarMatchesSugeridos(
  matches: Match[],
  pontuar: (m: Match) => Promise<{ score: number; descartado: boolean }>,
) {
  const minScore = getMinScore();
  for (const match of matches) {
    if (match.status !== "SUGGESTED") continue;
    const { score, descartado } = await pontuar(match);
    if ((descartado || score < minScore) && !(await teveTentativas(match.id))) {
      await prisma.match.delete({ where: { id: match.id } });
    } else {
      await prisma.match.update({ where: { id: match.id }, data: { score } });
    }
  }
}

// ---------- Item perdido ----------

export async function editarItemPerdido(
  id: string,
  userId: string,
  dados: LostItemInput,
): Promise<{ item: LostItem; motor: ResultadoDoMotor }> {
  const antes = conferirPermissao(
    await prisma.lostItem.findUnique({ where: { id }, include: { matches: true } }),
    userId,
  );

  const item = await prisma.lostItem.update({ where: { id }, data: dados });

  await revisarMatchesSugeridos(antes.matches, async (m) => {
    const achado = await prisma.foundItem.findUniqueOrThrow({ where: { id: m.foundItemId } });
    return calculateMatchScore(item, achado);
  });

  const motor = await runMatchingForLostItem(item);

  await recalcularStatusPerdido(id);
  for (const m of antes.matches) await recalcularStatusAchado(m.foundItemId);

  // Rele o item para devolver o status ja recalculado.
  return { item: await prisma.lostItem.findUniqueOrThrow({ where: { id } }), motor };
}

export async function excluirItemPerdido(id: string, userId: string): Promise<void> {
  const item = conferirPermissao(
    await prisma.lostItem.findUnique({ where: { id }, include: { matches: true } }),
    userId,
  );

  // So libera o item achado se ninguem tentou verificar (ver comentario no topo).
  const liberar: string[] = [];
  for (const m of item.matches) {
    if (!(await teveTentativas(m.id))) liberar.push(m.foundItemId);
  }

  await prisma.lostItem.delete({ where: { id } }); // apaga os matches junto (cascade)

  for (const foundItemId of liberar) await recalcularStatusAchado(foundItemId);
}

// ---------- Item achado ----------

export async function editarItemAchado(
  id: string,
  userId: string,
  dados: FoundItemInput,
): Promise<{ item: FoundItem; motor: ResultadoDoMotor }> {
  const antes = conferirPermissao(
    await prisma.foundItem.findUnique({ where: { id }, include: { matches: true } }),
    userId,
  );

  const item = await prisma.foundItem.update({ where: { id }, data: dados });

  await revisarMatchesSugeridos(antes.matches, async (m) => {
    const perdido = await prisma.lostItem.findUniqueOrThrow({ where: { id: m.lostItemId } });
    return calculateMatchScore(perdido, item);
  });

  const motor = await runMatchingForFoundItem(item);

  await recalcularStatusAchado(id);
  for (const m of antes.matches) await recalcularStatusPerdido(m.lostItemId);

  // Rele o item para devolver o status ja recalculado.
  return { item: await prisma.foundItem.findUniqueOrThrow({ where: { id } }), motor };
}

export async function excluirItemAchado(id: string, userId: string): Promise<void> {
  const item = conferirPermissao(
    await prisma.foundItem.findUnique({ where: { id }, include: { matches: true } }),
    userId,
  );

  await prisma.foundItem.delete({ where: { id } }); // apaga os matches junto (cascade)

  // Quem perdeu volta a esperar por um novo match.
  for (const m of item.matches) await recalcularStatusPerdido(m.lostItemId);
}
