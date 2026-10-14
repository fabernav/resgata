"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { CampoSenha, CampoTelefone } from "@/components/FormFields";
import { senhaValida } from "@/lib/password";
import { validarTelefone } from "@/lib/phone";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const podeEnviar =
    form.name.trim().length >= 2 &&
    form.email.includes("@") &&
    validarTelefone(form.phone) === null &&
    senhaValida(form.password);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="label">Nome</label>
        <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
      </div>
      <div>
        <label className="label">E-mail institucional</label>
        <input
          className="input"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>
      <CampoTelefone value={form.phone} onChange={(valor) => update("phone", valor)} />

      <CampoSenha value={form.password} onChange={(valor) => update("password", valor)} />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={loading || !podeEnviar}>
        {loading ? "Cadastrando..." : "Criar conta"}
      </button>
      <p className="text-center text-sm text-muted">
        Ja tem conta?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
