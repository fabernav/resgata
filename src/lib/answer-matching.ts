// Exigir a resposta EXATA e injusto: quem achou cadastrou "Tem um adesivo
// pequeno de um gato na tampa" e o dono digita "adesivo de gato". Por isso a
// comparacao e por palavras-chave, ignorando as que ja aparecem na pergunta
// (acertar essas nao prova nada).

import { mesmaPalavra, normalizar, palavrasChave } from "@/lib/texto";

const MINIMO_ABSOLUTO = 2;

// Para respostas longas, exige tambem esta fracao das palavras-chave.
const FRACAO_MINIMA = 0.4;

export interface ResultadoComparacao {
  aprovado: boolean;
  acertos: number;
  exigidas: number;
}

export function compararRespostas(
  digitada: string,
  cadastrada: string,
  pergunta = "",
): ResultadoComparacao {
  const textoDigitado = normalizar(digitada);
  const textoCadastrado = normalizar(cadastrada);

  if (!textoDigitado || !textoCadastrado) {
    return { aprovado: false, acertos: 0, exigidas: 1 };
  }

  if (textoDigitado === textoCadastrado) {
    return { aprovado: true, acertos: 1, exigidas: 1 };
  }

  const chavesCadastradas = palavrasChave(cadastrada);
  const chavesDigitadas = palavrasChave(digitada);
  const chavesDaPergunta = palavrasChave(pergunta);

  let chavesProbatorias = chavesCadastradas.filter(
    (chave) => !chavesDaPergunta.some((visivel) => mesmaPalavra(chave, visivel)),
  );

  // Se a resposta so repete a pergunta, considera todas, senao ninguem acertaria.
  if (chavesProbatorias.length === 0) {
    chavesProbatorias = chavesCadastradas;
  }

  // So palavras curtas ou comuns (ex: "azul", "R2"): so o texto igual aprova.
  if (chavesProbatorias.length === 0) {
    return { aprovado: false, acertos: 0, exigidas: 1 };
  }

  const acertos = chavesProbatorias.filter((chave) =>
    chavesDigitadas.some((palavra) => mesmaPalavra(chave, palavra)),
  ).length;

  const exigidas = Math.min(
    Math.max(MINIMO_ABSOLUTO, Math.ceil(FRACAO_MINIMA * chavesProbatorias.length)),
    chavesProbatorias.length,
  );

  return { aprovado: acertos >= exigidas, acertos, exigidas };
}
