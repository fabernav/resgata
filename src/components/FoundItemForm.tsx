"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { CATEGORY_LABELS } from "@/lib/categories";
import { PhotoInput } from "@/components/PhotoInput";
import { MatchCelebration } from "@/components/MatchCelebration";

export type FoundItemFormValues = {
  category: string;
  color: string;
  location: string;
  foundDate: string; // "AAAA-MM-DD", formato do <input type="date">
  description: string;
  photoUrl: string | null;
  photoBlurred: boolean;
  secretQuestion: string;
  secretAnswer: string;
};

export const foundItemVazio: FoundItemFormValues = {
  category: "OUTRO",
  color: "",
  location: "",
  foundDate: "",
  description: "",
  photoUrl: null,
  photoBlurred: false,
  secretQuestion: "",
  secretAnswer: "",
};

type Motor = { total: number; melhorPontuacao: number };

// Usado no cadastro (POST /api/found-items) e na edicao (PATCH /api/found-items/:id).
export function FoundItemForm({
  initial,
  endpoint,
  method,
  submitLabel,
  loadingLabel,
}: {
  initial: FoundItemFormValues;
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

  function update<K extends keyof FoundItemFormValues>(field: K, value: FoundItemFormValues[K]) {
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
          <label className="label">Local onde encontrou</label>
          <input
            className="input"
            required
            placeholder="Ex: Biblioteca central, Bloco B"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Data</label>
          <input
            className="input"
            type="date"
            required
            value={form.foundDate}
            onChange={(e) => update("foundDate", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Descricao publica</label>
          <textarea
            className="input"
            rows={3}
            required
            placeholder="Descricao visivel para todos no feed publico"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <PhotoInput
          value={form.photoUrl}
          onChange={(foto) => update("photoUrl", foto)}
          ajuda="A foto aparece no feed publico. E por ela que o dono costuma reconhecer o item."
        />

        {form.photoUrl && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-surface-muted p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 flex-none accent-[rgb(var(--brand))]"
              checked={form.photoBlurred}
              onChange={(e) => update("photoBlurred", e.target.checked)}
            />
            <span className="text-xs text-muted">
              <span className="font-medium text-fg">Desfocar a foto no feed publico.</span> Marque se a
              imagem mostrar dados de outra pessoa — a foto de uma carteira ou documento, por exemplo.
            </span>
          </label>
        )}

        <div className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-500/5 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
            <Lock className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">Verificacao de posse (privada)</span>
          </div>
          <p className="mb-2 text-xs text-muted">
            Estes dois campos NUNCA aparecem no feed publico. Faca uma pergunta especifica em vez de pedir um
            detalhe aleatorio — assim quem realmente perdeu o item sabe exatamente o que responder, mas um
            estranho nao consegue adivinhar.
          </p>
          <p className="mb-3 rounded-lg bg-violet-500/10 p-2.5 text-xs text-violet-700 dark:text-violet-300">
            <span className="font-medium">Pergunte algo que a foto nao mostra.</span> A foto revela o lado de
            fora do item; a pergunta e o que prova a posse. Prefira o conteudo de um bolso, um detalhe
            interno ou uma marca escondida — e nao um adesivo bem visivel na capa.
          </p>

          <label className="label text-xs">Pergunta (sera mostrada a quem tentar verificar)</label>
          <input
            className="input mb-3"
            required
            placeholder="Ex: O que tem de especial na capa/case do aparelho?"
            value={form.secretQuestion}
            onChange={(e) => update("secretQuestion", e.target.value)}
          />

          <label className="label text-xs">Resposta correta (fica sempre oculta)</label>
          <input
            className="input"
            required
            placeholder="Ex: Tem um adesivo de gato na tampa"
            value={form.secretAnswer}
            onChange={(e) => update("secretAnswer", e.target.value)}
          />
        </div>

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
