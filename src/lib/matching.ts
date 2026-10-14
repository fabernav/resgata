import { prisma } from "@/lib/prisma";
import type { FoundItem, LostItem } from "@prisma/client";
import { mesmaPalavra, normalizar, proporcaoEmComum } from "@/lib/texto";

// Cada criterio da pontuacao parcial em vez de tudo-ou-nada: "Preto" contra
// "Preta" nao pode zerar a cor, e um item achado anos depois nao pode valer o
// mesmo que um achado uma hora depois.

const PESOS = {
  CATEGORIA: 35,
  LOCAL: 30,
  COR: 15,
  DATA: 10,
  PALAVRAS: 10,
} as const;

// Folga para "achado antes de perdido": as pessoas erram a data em que perderam algo.
const FOLGA_DATA_DIAS = 3;

function getMinScore(): number {
  const raw = process.env.MATCH_MIN_SCORE;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : 50;
}

// "OUTRO" e ambiguo (uma capinha pode ser ELETRONICO ou OUTRO), entao nao desqualifica.
function pontuarCategoria(a: string, b: string): { pontos: number; incompativel: boolean } {
  if (a === b) return { pontos: PESOS.CATEGORIA, incompativel: false };
  if (a === "OUTRO" || b === "OUTRO") return { pontos: PESOS.CATEGORIA * 0.4, incompativel: false };
  return { pontos: 0, incompativel: true };
}

// Tamanho minimo 1 por causa de "Bloco A" x "Bloco B", onde so a letra diferencia.
function pontuarLocal(a: string, b: string): number {
  if (normalizar(a) === normalizar(b)) return PESOS.LOCAL;
  return PESOS.LOCAL * proporcaoEmComum(a, b, 1);
}

function pontuarCor(a: string, b: string): number {
  if (normalizar(a) === normalizar(b)) return PESOS.COR;
  if (mesmaPalavra(normalizar(a), normalizar(b))) return PESOS.COR;
  return PESOS.COR * proporcaoEmComum(a, b, 3);
}

// Intervalo grande nao elimina o match (o item pode ter ficado meses num
// achados e perdidos), so conta menos.
function pontuarData(perdido: Date, achado: Date): { pontos: number; impossivel: boolean } {
  const dias = (achado.getTime() - perdido.getTime()) / 86_400_000;

  if (dias < -FOLGA_DATA_DIAS) return { pontos: 0, impossivel: true };
  if (dias < 0) return { pontos: PESOS.DATA * 0.5, impossivel: false }; // confusao de data
  if (dias <= 7) return { pontos: PESOS.DATA, impossivel: false };
  if (dias <= 30) return { pontos: PESOS.DATA * 0.7, impossivel: false };
  if (dias <= 90) return { pontos: PESOS.DATA * 0.4, impossivel: false };
  return { pontos: PESOS.DATA * 0.2, impossivel: false };
}

function pontuarPalavras(a: string, b: string): number {
  return PESOS.PALAVRAS * proporcaoEmComum(a, b, 3);
}

export interface MatchBreakdown {
  score: number;
  descartado: boolean;
  motivo?: string;
  parcelas: {
    categoria: number;
    local: number;
    cor: number;
    data: number;
    palavras: number;
  };
}

export function calculateMatchScore(lost: LostItem, found: FoundItem): MatchBreakdown {
  const categoria = pontuarCategoria(lost.category, found.category);
  const data = pontuarData(lost.lostDate, found.foundDate);

  if (categoria.incompativel) {
    return descartar("Categorias diferentes");
  }
  if (data.impossivel) {
    return descartar("Item achado antes de ter sido perdido");
  }

  const parcelas = {
    categoria: categoria.pontos,
    local: pontuarLocal(lost.location, found.location),
    cor: pontuarCor(lost.color, found.color),
    data: data.pontos,
    palavras: pontuarPalavras(lost.description, found.description),
  };

  const score = Math.round(
    parcelas.categoria + parcelas.local + parcelas.cor + parcelas.data + parcelas.palavras,
  );

  return { score, descartado: false, parcelas };
}

function descartar(motivo: string): MatchBreakdown {
  return {
    score: 0,
    descartado: true,
    motivo,
    parcelas: { categoria: 0, local: 0, cor: 0, data: 0, palavras: 0 },
  };
}

async function createMatchIfNew(lostItem: LostItem, foundItem: FoundItem, score: number) {
  await prisma.match.upsert({
    where: {
      lostItemId_foundItemId: {
        lostItemId: lostItem.id,
        foundItemId: foundItem.id,
      },
    },
    update: { score },
    create: {
      lostItemId: lostItem.id,
      foundItemId: foundItem.id,
      score,
    },
  });

  await prisma.lostItem.update({
    where: { id: lostItem.id },
    data: { status: "MATCHED" },
  });
  await prisma.foundItem.update({
    where: { id: foundItem.id },
    data: { status: "MATCHED" },
  });
}

export interface ResultadoDoMotor {
  total: number;
  melhorPontuacao: number;
}

export async function runMatchingForLostItem(lostItem: LostItem): Promise<ResultadoDoMotor> {
  const minScore = getMinScore();
  const candidates = await prisma.foundItem.findMany({ where: { status: "AVAILABLE" } });

  const encontrados: number[] = [];
  for (const found of candidates) {
    const { score, descartado } = calculateMatchScore(lostItem, found);
    if (!descartado && score >= minScore) {
      await createMatchIfNew(lostItem, found, score);
      encontrados.push(score);
    }
  }

  return resumir(encontrados);
}

export async function runMatchingForFoundItem(foundItem: FoundItem): Promise<ResultadoDoMotor> {
  const minScore = getMinScore();
  const candidates = await prisma.lostItem.findMany({ where: { status: "PENDING_MATCH" } });

  const encontrados: number[] = [];
  for (const lost of candidates) {
    const { score, descartado } = calculateMatchScore(lost, foundItem);
    if (!descartado && score >= minScore) {
      await createMatchIfNew(lost, foundItem, score);
      encontrados.push(score);
    }
  }

  return resumir(encontrados);
}

function resumir(pontuacoes: number[]): ResultadoDoMotor {
  return {
    total: pontuacoes.length,
    melhorPontuacao: pontuacoes.length ? Math.max(...pontuacoes) : 0,
  };
}
