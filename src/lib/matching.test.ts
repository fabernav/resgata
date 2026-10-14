import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateMatchScore } from "./matching";
import type { FoundItem, LostItem } from "@prisma/client";

const LIMITE = 50; // igual ao MATCH_MIN_SCORE padrao

const hoje = new Date("2026-08-21T12:00:00Z");
const diasDepois = (n: number) => new Date(hoje.getTime() + n * 86_400_000);

function perdido(dados: Partial<LostItem>): LostItem {
  return {
    id: "l1",
    category: "ELETRONICO",
    color: "Preto",
    location: "Biblioteca central",
    lostDate: hoje,
    description: "Fone de ouvido bluetooth preto com estojo",
    photoUrl: null,
    status: "PENDING_MATCH",
    createdAt: hoje,
    updatedAt: hoje,
    userId: "u1",
    ...dados,
  } as LostItem;
}

function achado(dados: Partial<FoundItem>): FoundItem {
  return {
    id: "f1",
    category: "ELETRONICO",
    color: "Preto",
    location: "Biblioteca central",
    foundDate: hoje,
    description: "Fone de ouvido bluetooth encontrado na mesa de estudos",
    photoUrl: null,
    secretQuestion: "q",
    secretAnswer: "a",
    status: "AVAILABLE",
    createdAt: hoje,
    updatedAt: hoje,
    userId: "u2",
    ...dados,
  } as FoundItem;
}

const pontos = (l: LostItem, f: FoundItem) => calculateMatchScore(l, f);

// ============================ DEVE DAR MATCH ============================

test("caso ideal: mesmo item, mesmo lugar, achado no dia seguinte", () => {
  const r = pontos(perdido({}), achado({ foundDate: diasDepois(1) }));
  assert.equal(r.descartado, false);
  assert.ok(r.score >= 90, `esperado >= 90, obtido ${r.score}`);
});

test("achado um mes depois ainda da match, com pontuacao menor", () => {
  const rapido = pontos(perdido({}), achado({ foundDate: diasDepois(1) }));
  const demorado = pontos(perdido({}), achado({ foundDate: diasDepois(30) }));

  assert.ok(demorado.score >= LIMITE, `esperado >= ${LIMITE}, obtido ${demorado.score}`);
  assert.ok(
    demorado.score < rapido.score,
    "achado um mes depois deveria pontuar menos que achado no dia seguinte",
  );
});

test("achado seis meses depois: raro, mas ainda possivel", () => {
  const r = pontos(perdido({}), achado({ foundDate: diasDepois(180) }));
  assert.equal(r.descartado, false);
  assert.ok(r.score >= LIMITE, `esperado >= ${LIMITE}, obtido ${r.score}`);
});

test("cor no feminino nao pode zerar a pontuacao de cor", () => {
  const r = pontos(perdido({ color: "Preto" }), achado({ color: "Preta" }));
  assert.ok(r.parcelas.cor > 0, "'Preto' e 'Preta' deveriam contar como a mesma cor");
});

test("cor composta conta parcialmente", () => {
  const r = pontos(perdido({ color: "Azul" }), achado({ color: "Azul marinho" }));
  assert.ok(r.parcelas.cor > 0, "'Azul' e 'Azul marinho' deveriam ter alguma afinidade");
});

test("mesmo lugar descrito de formas diferentes", () => {
  const r = pontos(
    perdido({ location: "Biblioteca central" }),
    achado({ location: "Biblioteca do campus" }),
  );
  assert.ok(r.parcelas.local > 0, "as duas descricoes falam da biblioteca");
  assert.ok(r.score >= LIMITE, `esperado >= ${LIMITE}, obtido ${r.score}`);
});

test("local mais especifico que o outro conta como o mesmo lugar", () => {
  const r = pontos(
    perdido({ location: "Bloco A" }),
    achado({ location: "Bloco A - sala 12" }),
  );
  assert.equal(Math.round(r.parcelas.local), 30);
});

test("dono errou a data por um dia", () => {
  const r = pontos(perdido({ lostDate: hoje }), achado({ foundDate: diasDepois(-1) }));
  assert.equal(r.descartado, false, "um dia de diferenca e confusao comum, nao impossibilidade");
  assert.ok(r.score >= LIMITE, `esperado >= ${LIMITE}, obtido ${r.score}`);
});

test("categoria OUTRO nao elimina o match (balde ambiguo)", () => {
  const r = pontos(perdido({ category: "ELETRONICO" }), achado({ category: "OUTRO" }));
  assert.equal(r.descartado, false);
  assert.ok(r.parcelas.categoria > 0, "OUTRO deveria valer parcialmente");
});

// ========================= NAO DEVE DAR MATCH =========================

test("categorias diferentes sao itens diferentes", () => {
  const r = pontos(perdido({ category: "CHAVE" }), achado({ category: "LIVRO_MATERIAL" }));
  assert.equal(r.descartado, true);
  assert.equal(r.motivo, "Categorias diferentes");
});

test("item achado bem antes de ter sido perdido e impossivel", () => {
  const r = pontos(perdido({ lostDate: hoje }), achado({ foundDate: diasDepois(-60) }));
  assert.equal(r.descartado, true);
  assert.equal(r.motivo, "Item achado antes de ter sido perdido");
});

test("mesma categoria, mas tudo o resto diferente", () => {
  const r = pontos(
    perdido({
      category: "ELETRONICO",
      color: "Preto",
      location: "Biblioteca central",
      description: "Fone de ouvido bluetooth",
    }),
    achado({
      category: "ELETRONICO",
      color: "Vermelho",
      location: "Quadra poliesportiva",
      description: "Carregador de notebook",
      foundDate: diasDepois(40),
    }),
  );
  assert.ok(r.score < LIMITE, `esperado < ${LIMITE}, obtido ${r.score}`);
});

test("so a categoria em comum nao basta", () => {
  const r = pontos(
    perdido({ color: "Preto", location: "Bloco A", description: "Fone de ouvido" }),
    achado({
      color: "Branco",
      location: "Cantina",
      description: "Carregador de notebook",
      foundDate: diasDepois(120),
    }),
  );
  assert.ok(r.score < LIMITE, `esperado < ${LIMITE}, obtido ${r.score}`);
});

test("locais diferentes no mesmo predio nao valem local inteiro", () => {
  const r = pontos(perdido({ location: "Bloco A" }), achado({ location: "Bloco B" }));
  assert.ok(
    r.parcelas.local < 30,
    `Bloco A e Bloco B nao sao o mesmo lugar (obtido ${r.parcelas.local})`,
  );
});

// ======================= ORDEM DAS PONTUACOES =======================

test("quanto mais criterios batem, maior a pontuacao", () => {
  const tudo = pontos(perdido({}), achado({ foundDate: diasDepois(1) })).score;
  const semCor = pontos(perdido({}), achado({ color: "Verde", foundDate: diasDepois(1) })).score;
  const semLocal = pontos(
    perdido({}),
    achado({ color: "Verde", location: "Cantina", foundDate: diasDepois(1) }),
  ).score;

  assert.ok(tudo > semCor, "perder a cor deveria reduzir a pontuacao");
  assert.ok(semCor > semLocal, "perder o local deveria reduzir ainda mais");
});
