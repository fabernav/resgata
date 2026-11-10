export const PALAVRAS_IGNORADAS = new Set([
  "de", "da", "do", "das", "dos", "no", "na", "nos", "nas", "em", "um", "uma",
  "uns", "umas", "o", "a", "os", "as", "e", "com", "sem", "por", "para", "que",
  "tem", "ter", "esta", "eh", "meu", "minha", "seu", "sua", "ele", "ela",
  "muito", "mais", "menos", "bem", "tipo", "cor", "lado", "parte",
]);

/** Minusculas, sem acento, sem pontuacao, com espacos normalizados. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Sem os artigos de uma letra: em nomes de local, "A" e "B" identificam predios.
const LIGACOES = new Set([
  "de", "da", "do", "das", "dos", "no", "na", "nos", "nas",
  "em", "com", "sem", "por", "para", "que",
]);

// tamanhoMinimo: 3 para descricao livre, 1 para local ("Bloco A" x "Bloco B").
export function palavrasChave(texto: string, tamanhoMinimo = 3): string[] {
  const descartar = tamanhoMinimo >= 3 ? PALAVRAS_IGNORADAS : LIGACOES;
  return normalizar(texto)
    .split(" ")
    .filter((p) => p.length >= tamanhoMinimo && !descartar.has(p));
}

/** Distancia de Levenshtein: quantas letras mudam de uma palavra para a outra. */
export function distancia(a: string, b: string): number {
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0]!;
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = linha[j]!;
      linha[j] = Math.min(
        linha[j]! + 1,
        linha[j - 1]! + 1,
        anterior + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      anterior = temp;
    }
  }

  return linha[b.length]!;
}

/** Corta plural e diminutivo/aumentativo comuns do portugues. */
export function radical(palavra: string): string {
  return palavra
    .replace(/(zinhos|zinhas|zinho|zinha|inhos|inhas|inho|inha|zoes|zao)$/, "")
    .replace(/(es|s)$/, "");
}

function parecidas(a: string, b: string): boolean {
  if (a === b) return true;

  const [curta, longa] = a.length <= b.length ? [a, b] : [b, a];
  if (curta.length >= 4 && longa.startsWith(curta)) return true;

  // Com tolerancia 1, uma letra sozinha casaria com qualquer outra.
  if (longa.length <= 3) return false;

  const tolerancia = longa.length <= 5 ? 1 : 2;
  return distancia(a, b) <= tolerancia;
}

// Cobre plural, genero, diminutivo e erro de digitacao ("tampa"/"tanpa").
export function mesmaPalavra(a: string, b: string): boolean {
  if (parecidas(a, b)) return true;

  const ra = radical(a);
  const rb = radical(b);
  return ra.length >= 3 && rb.length >= 3 && parecidas(ra, rb);
}

// De 0 a 1. Divide pelo MENOR conjunto, e nao pela uniao, para nao punir a
// descricao mais detalhada ("Biblioteca" x "Biblioteca central do campus").
export function proporcaoEmComum(textoA: string, textoB: string, tamanhoMinimo = 3): number {
  const a = palavrasChave(textoA, tamanhoMinimo);
  const b = palavrasChave(textoB, tamanhoMinimo);
  if (a.length === 0 || b.length === 0) return 0;

  const emComum = a.filter((palavra) => b.some((outra) => mesmaPalavra(palavra, outra))).length;
  return Math.min(1, emComum / Math.min(a.length, b.length));
}
