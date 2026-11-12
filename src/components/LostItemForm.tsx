"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { CATEGORY_LABELS } from "@/lib/categories";
import { PhotoInput } from "@/components/PhotoInput";
import { MatchCelebration } from "@/components/MatchCelebration";

export type LostItemFormValues = {
  category: string;
  color: string;
  location: string;
  lostDate: string; // "AAAA-MM-DD", formato do <input type="date">
  description: string;
  photoUrl: string | null;
};

export const lostItemVazio: LostItemFormValues = {
  category: "OUTRO",
  color: "",
  location: "",
  lostDate: "",
  description: "",
  photoUrl: null,
};

type Motor = { total: number; melhorPontuacao: number };

// Usado no cadastro (POST /api/lost-items) e na edicao (PATCH /api/lost-items/:id).
export function LostItemForm({
  initial,
  endpoint,
  method,
  submitLabel,
  loadingLabel,
}: {
  initial: LostItemFormValues;
  endpoint: string;
  method: "POST" | "PATCH";
  submitLabel: string;
  loadingLabel: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [motor, setMotor] = useState<Motor | null>(null);

  function update<K extends keyof LostItemFormValues>(field: K, value: LostItemFormValues[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { motor } = await apiFetch<{ motor: Motor }>(endpoint, { method, body: JSON.stringify(form) });
      router.refresh();

      if (motor.total > 0) {
        setMotor(motor);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
          {loading ? loadingLabel : submitLabel}
        </button>
      </form>

      {motor && (
        <MatchCelebration
          total={motor.total}
          melhorPontuacao={motor.melhorPontuacao}
          onFechar={() => router.push("/dashboard")}
        />
      )}
    </>
  );
}
