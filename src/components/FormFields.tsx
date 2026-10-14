"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { formatarTelefone } from "@/lib/phone";
import { REGRAS_SENHA } from "@/lib/password";

export function CampoTelefone({
  value,
  onChange,
}: {
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="label" htmlFor="telefone">
        Telefone / Celular
      </label>
      <input
        id="telefone"
        className="input"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="(11) 91234-5678"
        required
        value={value}
        onChange={(e) => onChange(formatarTelefone(e.target.value))}
      />
    </div>
  );
}

export function CampoSenha({
  value,
  onChange,
  label = "Senha",
  mostrarRequisitos = true,
}: {
  value: string;
  onChange: (valor: string) => void;
  label?: string;
  mostrarRequisitos?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);
  const [tocado, setTocado] = useState(false);

  return (
    <div>
      <label className="label" htmlFor="senha">
        {label}
      </label>

      <div className="relative">
        <input
          id="senha"
          className="input pr-11"
          type={visivel ? "text" : "password"}
          autoComplete="new-password"
          required
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setTocado(true);
          }}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:text-brand"
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        >
          {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {mostrarRequisitos && (
        <ul className="mt-2 grid gap-1">
          {REGRAS_SENHA.map((regra) => {
            const ok = regra.cumpre(value);
            return (
              <li
                key={regra.id}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  ok
                    ? "text-emerald-600 dark:text-emerald-400"
                    : tocado
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted"
                }`}
              >
                {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {regra.descricao}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
