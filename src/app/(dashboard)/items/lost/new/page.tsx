"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageX } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { CATEGORY_LABELS } from "@/lib/categories";
import { BackLink } from "@/components/BackLink";
import { PhotoInput } from "@/components/PhotoInput";
import { MatchCelebration } from "@/components/MatchCelebration";

const initialForm = {
  category: "OUTRO",
  color: "",
  location: "",
  lostDate: "",
  description: "",
  photoUrl: null as string | null,
};

// useSearchParams precisa de um limite de Suspense no App Router.
export default function NewLostItemPage() {
  return (
    <Suspense fallback={null}>
      <FormularioItemPerdido />
    </Suspense>
  );
}

function FormularioItemPerdido() {
  const router = useRouter();

  // Preenchido pelo botao "Perdi um item parecido" na tela de um item achado.
  const params = useSearchParams();
  const [form, setForm] = useState(() => ({
    ...initialForm,
    category: params.get("category") ?? initialForm.category,
    color: params.get("color") ?? initialForm.color,
    location: params.get("location") ?? initialForm.location,
  }));

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [motor, setMotor] = useState<{ total: number; melhorPontuacao: number } | null>(null);

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { motor } = await apiFetch<{ motor: { total: number; melhorPontuacao: number } }>(
        "/api/lost-items",
        { method: "POST", body: JSON.stringify(form) },
      );
      router.refresh();

      if (motor.total > 0) {
        setMotor(motor);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/dashboard" label="Voltar ao dashboard" />
      <div className="mb-6 flex items-center gap-2">
        <PackageX className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Registrar Item Perdido</h1>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={form.category} onChange={(e) => update("category", e.target.value)}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Cor</label>
          <input className="input" required value={form.color} onChange={(e) => update("color", e.target.value)} />
        </div>
        <div>
          <label className="label">Local aproximado</label>
          <input
            className="input"
            required
            placeholder="Ex: Biblioteca central, Bloco B"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Data da perda</label>
          <input
            className="input"
            type="date"
            required
            value={form.lostDate}
            onChange={(e) => update("lostDate", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Descricao livre</label>
          <textarea
            className="input"
            rows={4}
            required
            placeholder="Descreva o item com o maximo de detalhes"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
        <PhotoInput
          value={form.photoUrl}
          onChange={(foto) => update("photoUrl", foto)}
          ajuda="Serve como referencia sua. A foto do item perdido nao aparece para outras pessoas."
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Registrando..." : "Registrar item perdido"}
        </button>
      </form>

      {motor && (
        <MatchCelebration
          total={motor.total}
          melhorPontuacao={motor.melhorPontuacao}
          onFechar={() => router.push("/dashboard")}
        />
      )}
    </div>
  );
}
