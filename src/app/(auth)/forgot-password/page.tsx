"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar o e-mail");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div className="card space-y-4 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-brand" />
        <h2 className="text-lg font-semibold text-fg">Confira seu e-mail</h2>
        <p className="text-sm text-muted">
          Se <span className="font-medium text-fg">{email}</span> estiver cadastrado, voce vai receber um link
          para criar uma nova senha. Ele vale por 30 minutos. Olhe tambem a caixa de spam.
        </p>
        <Link href="/login" className="btn-primary inline-flex w-full justify-center">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">Esqueci minha senha</h2>
        <p className="mt-1 text-sm text-muted">
          Informe o e-mail da sua conta e enviaremos um link para criar uma senha nova.
        </p>
      </div>
      <div>
        <label className="label">E-mail</label>
        <input
          className="input"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link"}
      </button>
      <p className="text-center text-sm text-muted">
        Lembrou?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
