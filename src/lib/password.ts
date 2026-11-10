export interface RegraSenha {
  id: string;
  descricao: string;
  cumpre: (senha: string) => boolean;
}

export const REGRAS_SENHA: RegraSenha[] = [
  { id: "tamanho", descricao: "Pelo menos 8 caracteres", cumpre: (s) => s.length >= 8 },
  { id: "maiuscula", descricao: "Uma letra maiuscula", cumpre: (s) => /[A-Z]/.test(s) },
  { id: "minuscula", descricao: "Uma letra minuscula", cumpre: (s) => /[a-z]/.test(s) },
  { id: "numero", descricao: "Um numero", cumpre: (s) => /[0-9]/.test(s) },
  {
    id: "especial",
    descricao: "Um caractere especial (!@#$...)",
    cumpre: (s) => /[^A-Za-z0-9]/.test(s),
  },
];

export function regrasPendentes(senha: string): RegraSenha[] {
  return REGRAS_SENHA.filter((regra) => !regra.cumpre(senha));
}

export function senhaValida(senha: string): boolean {
  return regrasPendentes(senha).length === 0;
}
