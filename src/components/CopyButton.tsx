"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ valor, rotulo }: { valor: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 1800);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      return;
    } catch {
      // plano B para navegadores que bloqueiam a API
    }

    try {
      const campo = document.createElement("textarea");
      campo.value = valor;
      campo.style.position = "fixed";
      campo.style.opacity = "0";
      document.body.appendChild(campo);
      campo.select();
      document.execCommand("copy");
      document.body.removeChild(campo);
      setCopiado(true);
    } catch {
      // sem copia automatica: a pessoa ainda pode selecionar o texto na tela
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg border transition-colors ${
        copiado
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-subtle text-muted hover:border-brand hover:text-brand"
      }`}
      aria-label={copiado ? `${rotulo} copiado` : `Copiar ${rotulo}`}
      title={copiado ? "Copiado!" : `Copiar ${rotulo}`}
    >
      {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
