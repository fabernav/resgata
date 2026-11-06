"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Timer } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api-client";

// Guarda ate quando o login esta travado, para o bloqueio continuar valendo
// se a pessoa recarregar a pagina. O servidor tambem bloqueia por conta propria.
const CHAVE_BLOQUEIO = "loginBloqueadoAte";

function lerBloqueioSalvo(): number {
  try {
    return Number(sessionStorage.getItem(CHAVE_BLOQUEIO)) || 0;
  } catch {
    return 0;
  }
}

function salvarBloqueio(ate: number) {
  try {
    sessionStorage.setItem(CHAVE_BLOQUEIO, String(ate));
  } catch {
    // sem armazenamento: o servidor continua bloqueando
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [bloqueadoAte, setBloqueadoAte] = useState(0);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    setBloqueadoAte(lerBloqueioSalvo());
  }, []);

  const segundosRestantes = Math.max(0, Math.ceil((bloqueadoAte - agora) / 1000));
  const bloqueado = segundosRestantes > 0;

  // Atualiza a contagem regressiva a cada segundo enquanto estiver travado.
  useEffect(() => {
    if (bloqueadoAte <= Date.now()) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setAgora(t);
      if (t >= bloqueadoAte) {
        clearInterval(timer);
        setError(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [bloqueadoAte]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado) return;
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        const ate = Date.now() + Number(err.data.retryAfter ?? 60) * 1000;
        setBloqueadoAte(ate);
        setAgora(Date.now());
        salvarBloqueio(ate);
        setPassword("");
      }
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="label">E-mail</label>
        <input
          className="input"
          type="email"
          required
          autoComplete="email"
          disabled={bloqueado}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="label">Senha</label>
          <Link href="/forgot-password" className="text-xs text-brand hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <input
          className="input"
          type="password"
          required
          autoComplete="current-password"
          disabled={bloqueado}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {bloqueado ? (
        <p className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <Timer className="h-4 w-4 flex-none" />
          Muitas tentativas erradas. Tente de novo em {segundosRestantes}s.
        </p>
      ) : (
        error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading || bloqueado}>
        {bloqueado ? `Aguarde ${segundosRestantes}s` : loading ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-sm text-muted">
        Nao tem conta?{" "}
        <Link href="/register" className="text-brand hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
