import { test } from "node:test";
import assert from "node:assert/strict";
import { compararRespostas } from "./answer-matching";

const CADASTRADA = "Tem um adesivo pequeno de um gato na tampa";

test("aceita a resposta exatamente igual", () => {
  assert.equal(compararRespostas(CADASTRADA, CADASTRADA).aprovado, true);
});

test("ignora maiusculas, acentos, pontuacao e espacos extras", () => {
  assert.equal(
    compararRespostas("  TEM UM ADESIVO PEQUENO DE UM GATO NA TAMPA!!! ", CADASTRADA).aprovado,
    true,
  );
});

test("aceita a mesma ideia escrita com menos palavras", () => {
  assert.equal(compararRespostas("adesivo de gato", CADASTRADA).aprovado, true);
  assert.equal(compararRespostas("um gato adesivo na tampa", CADASTRADA).aprovado, true);
});

test("aceita plural e diminutivo", () => {
  assert.equal(compararRespostas("adesivos de gatinho", CADASTRADA).aprovado, true);
});

test("perdoa erro de digitacao", () => {
  assert.equal(compararRespostas("adesivo de gato na tanpa", CADASTRADA).aprovado, true);
});

test("recusa quem nao conhece o item", () => {
  assert.equal(compararRespostas("uma capa preta", CADASTRADA).aprovado, false);
  assert.equal(compararRespostas("nao sei", CADASTRADA).aprovado, false);
  assert.equal(compararRespostas("azul", CADASTRADA).aprovado, false);
});

test("recusa quando so uma palavra coincide", () => {
  assert.equal(compararRespostas("tampa", CADASTRADA).aprovado, false);
  assert.equal(compararRespostas("adesivo", CADASTRADA).aprovado, false);
});

test("palavras que estao na propria pergunta nao valem como prova", () => {
  const pergunta = "O que tem de especial na tampa do estojo de carregamento?";

  // "tampa" e "estojo" ja aparecem na pergunta
  assert.equal(compararRespostas("tampa do estojo", CADASTRADA, pergunta).aprovado, false);

  assert.equal(compararRespostas("adesivo de gato", CADASTRADA, pergunta).aprovado, true);
});

test("recusa resposta vazia", () => {
  assert.equal(compararRespostas("", CADASTRADA).aprovado, false);
  assert.equal(compararRespostas("   ", CADASTRADA).aprovado, false);
});

test("resposta cadastrada curta exige as mesmas palavras", () => {
  const curta = "risco na quina esquerda";
  assert.equal(compararRespostas("risco na quina esquerda", curta).aprovado, true);
  assert.equal(compararRespostas("um risco na quina do lado esquerdo", curta).aprovado, true);
  assert.equal(compararRespostas("esta amassado", curta).aprovado, false);
});
