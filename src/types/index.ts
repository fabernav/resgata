export type ItemCategory =
  | "ELETRONICO"
  | "DOCUMENTO"
  | "ROUPA_ACESSORIO"
  | "CHAVE"
  | "LIVRO_MATERIAL"
  | "BOLSA_MOCHILA"
  | "OUTRO";

export type LostItemStatus = "PENDING_MATCH" | "MATCHED" | "RESOLVED";

export type FoundItemStatus = "AVAILABLE" | "MATCHED" | "RESOLVED";

export type MatchStatus = "SUGGESTED" | "VERIFIED" | "BLOCKED" | "RESOLVED";
