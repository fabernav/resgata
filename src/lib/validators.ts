import { z } from "zod";
import { REGRAS_SENHA } from "@/lib/password";
import { validarTelefone } from "@/lib/phone";

export const ITEM_CATEGORIES = [
  "ELETRONICO",
  "DOCUMENTO",
  "ROUPA_ACESSORIO",
  "CHAVE",
  "LIVRO_MATERIAL",
  "BOLSA_MOCHILA",
  "OUTRO",
] as const;

const senhaSchema = z.string().superRefine((senha, ctx) => {
  for (const regra of REGRAS_SENHA) {
    if (!regra.cumpre(senha)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: regra.descricao });
    }
  }
});

const telefoneSchema = z.string().superRefine((valor, ctx) => {
  const erro = validarTelefone(valor);
  if (erro) ctx.addIssue({ code: z.ZodIssueCode.custom, message: erro });
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail invalido").refine((email) => email.includes("."), {
    message: "Use seu e-mail institucional",
  }),
  phone: telefoneSchema,
  password: senhaSchema,
});

export const loginSchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(1, "Senha obrigatoria"),
});

// O navegador ja comprime a foto, mas a API pode ser chamada direto.
const LIMITE_FOTO_BYTES = 700 * 1024;

const fotoSchema = z
  .string()
  .refine((valor) => valor.startsWith("data:image/"), "Formato de imagem invalido")
  .refine(
    (valor) => valor.length <= LIMITE_FOTO_BYTES,
    "Imagem muito grande. Tente uma foto menor.",
  )
  .optional()
  .nullable();

export const lostItemSchema = z.object({
  category: z.enum(ITEM_CATEGORIES),
  color: z.string().min(1, "Informe a cor"),
  location: z.string().min(1, "Informe o local aproximado"),
  lostDate: z.coerce.date(),
  description: z.string().min(5, "Descreva o item com mais detalhes"),
  photoUrl: fotoSchema,
});

export const foundItemSchema = z.object({
  category: z.enum(ITEM_CATEGORIES),
  color: z.string().min(1, "Informe a cor"),
  location: z.string().min(1, "Informe onde encontrou"),
  foundDate: z.coerce.date(),
  description: z.string().min(5, "Descreva o item com mais detalhes"),
  photoUrl: fotoSchema,
  photoBlurred: z.boolean().optional().default(false),
  secretQuestion: z.string().min(5, "Escreva uma pergunta clara para quem tentar a verificacao"),
  secretAnswer: z.string().min(2, "Informe a resposta correta, que so o verdadeiro dono saberia"),
});

export const verificationAnswerSchema = z.object({
  answer: z.string().min(1, "Resposta obrigatoria"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LostItemInput = z.infer<typeof lostItemSchema>;
export type FoundItemInput = z.infer<typeof foundItemSchema>;
