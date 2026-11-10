import { test } from "node:test";
import assert from "node:assert/strict";
import { senhaValida, regrasPendentes } from "./password";
import { formatarTelefone, validarTelefone } from "./phone";

test("senha: recusa as fracas mais comuns", () => {
  assert.equal(senhaValida("123456"), false);
  assert.equal(senhaValida("senha123"), false); // sem maiuscula e sem especial
  assert.equal(senhaValida("Senha123"), false); // sem caractere especial
  assert.equal(senhaValida("Senha@1"), false); // menos de 8 caracteres
  assert.equal(senhaValida("SENHA@123"), false); // sem minuscula
  assert.equal(senhaValida("Senha@abc"), false); // sem numero
});

test("senha: aceita quando cumpre todas as regras", () => {
  assert.equal(senhaValida("Campus@2026"), true);
  assert.equal(senhaValida("Resgata#99"), true);
});

test("senha: aponta exatamente o que esta faltando", () => {
  const faltando = regrasPendentes("senha").map((r) => r.id);
  assert.deepEqual(faltando.sort(), ["especial", "maiuscula", "numero", "tamanho"].sort());
});

test("telefone: monta a mascara conforme digita", () => {
  assert.equal(formatarTelefone("1"), "(1");
  assert.equal(formatarTelefone("11"), "(11");
  assert.equal(formatarTelefone("11912"), "(11) 912");
  assert.equal(formatarTelefone("11912345678"), "(11) 91234-5678");
});

test("telefone: ignora letras e pontuacao digitadas", () => {
  assert.equal(formatarTelefone("abc11def91234ghi5678"), "(11) 91234-5678");
});

test("telefone: nao passa de 11 digitos", () => {
  assert.equal(formatarTelefone("119123456789999"), "(11) 91234-5678");
});

test("telefone: aceita celular valido", () => {
  assert.equal(validarTelefone("(11) 91234-5678"), null);
  assert.equal(validarTelefone("11912345678"), null);
});

test("telefone: recusa numero incompleto", () => {
  assert.notEqual(validarTelefone("(11) 9123"), null);
});

test("telefone: recusa telefone fixo", () => {
  // fixo nao tem o 9 depois do DDD
  assert.notEqual(validarTelefone("(11) 3234-5678"), null);
});

test("telefone: recusa DDD invalido", () => {
  assert.notEqual(validarTelefone("(01) 91234-5678"), null);
});

test("telefone: recusa sequencia repetida", () => {
  assert.notEqual(validarTelefone("(11) 99999-9999"), null);
});
