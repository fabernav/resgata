import type { FoundItem } from "@prisma/client";

// Todo endpoint que retorna um FoundItem deve passar por aqui, para nunca
// expor a pergunta e a resposta de verificacao.

export type PublicFoundItem = Omit<FoundItem, "secretQuestion" | "secretAnswer" | "userId">;

export function toPublicFoundItem(item: FoundItem): PublicFoundItem {
  const { secretQuestion, secretAnswer, userId, ...publicFields } = item;
  return publicFields;
}

export function toPublicFoundItemList(items: FoundItem[]): PublicFoundItem[] {
  return items.map(toPublicFoundItem);
}
