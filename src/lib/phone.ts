// Celular brasileiro: (DD) 9XXXX-XXXX

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarTelefone(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function validarTelefone(valor: string): string | null {
  const d = apenasDigitos(valor);

  if (d.length !== 11) return "Informe DDD e numero, com 11 digitos";
  if (Number(d.slice(0, 2)) < 11) return "DDD invalido";
  if (d[2] !== "9") return "Informe um celular: o numero comeca com 9 apos o DDD";

  // rejeita sequencias obvias como (11) 99999-9999
  if (/^(\d)\1+$/.test(d.slice(2))) return "Numero invalido";

  return null;
}
