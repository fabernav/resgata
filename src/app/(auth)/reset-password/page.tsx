"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { CampoSenha } from "@/components/FormFields";
import { senhaValida } from "@/lib/password";

// useSearchParams precisa de um limite de Suspense no App Router.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <FormularioNovaSenha />
    </Suspense>
  );
}

function FormularioNovaSenha() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [concluido, setConcluido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const senhasIguais = password === confirmacao;
  const podeEnviar = senhaValida(password) && senhasIguais && confirmacao.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEnviar) return;
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setConcluido(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir a senha");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card space-y-4 text-center">
        <p className="text-sm text-muted">Link incompleto. Abra o link exatamente como veio no e-mail.</p>
        <Link href="/forgot-password" className="text-sm text-brand hover:underline">
          Pedir um novo link
        </Link>
      </div>
    );
  }

  if (concluido) {
    return (
      <div className="card space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h2 className="text-lg font-semibold text-fg">Senha redefinida</h2>
        <p className="text-sm text-muted">Agora e so entrar com a senha nova.</p>
        <Link href="/login" className="btn-primary inline-flex w-full justify-center">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold text-fg">Criar nova senha</h2>
      <CampoSenha value={password} onChange={setPassword} label="Nova senha" />
      <div>
        <label className="label" htmlFor="confirmacao">
          Repita a nova senha
        </label>
        <input
          id="confirmacao"
          className="input"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
        {confirmacao && !senhasIguais && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">As senhas nao sao iguais.</p>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}{" "}
          <Link href="/forgot-password" className="underline">
            Pedir novo link
          </Link>
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading || !podeEnviar}>
        {loading ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
