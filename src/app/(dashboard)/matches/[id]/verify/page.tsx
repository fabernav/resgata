"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, HelpCircle, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { BackLink } from "@/components/BackLink";

interface QuestionResponse {
  question: string;
  status: "SUGGESTED" | "VERIFIED" | "BLOCKED" | "RESOLVED";
  attemptsRemaining: number;
}

interface VerifyResponse {
  success: boolean;
  attemptsRemaining: number;
  status: "VERIFIED" | "BLOCKED" | "SUGGESTED";
}

export default function MatchVerifyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [question, setQuestion] = useState<QuestionResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(true);

  useEffect(() => {
    apiFetch<QuestionResponse>(`/api/matches/${params.id}/verify`)
      .then(setQuestion)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar pergunta"))
      .finally(() => setLoadingQuestion(false));
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<VerifyResponse>(`/api/matches/${params.id}/verify`, {
        method: "POST",
        body: JSON.stringify({ answer }),
      });
      setResult(data);
      if (data.success) {
        router.push(`/matches/${params.id}/contact`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar");
    } finally {
      setLoading(false);
    }
  }

  const blocked = result?.status === "BLOCKED" || question?.status === "BLOCKED";

  return (
    <div className="mx-auto max-w-md">
      <BackLink href="/dashboard" label="Voltar ao dashboard" />
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Verificacao de Posse</h1>
      </div>
      <p className="mb-4 text-sm text-muted">
        Para liberar o contato de quem encontrou o item, responda a pergunta abaixo. Voce tem no maximo 3
        tentativas.
      </p>

      {loadingQuestion ? (
        <p className="text-sm text-muted">Carregando pergunta...</p>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          {question && (
            <div className="rounded-xl border border-brand/30 bg-brand/10 p-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-brand">
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Pergunta de verificacao</span>
              </div>
              <p className="text-sm text-fg">{question.question}</p>
            </div>
          )}

          <div>
            <label className="label">Sua resposta</label>
            <textarea
              className="input"
              rows={3}
              required
              disabled={blocked}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted">
              Nao precisa ser exato: escreva com suas palavras. O sistema compara o conteudo da
              resposta, nao a frase inteira.
            </p>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
          {result && !result.success && !blocked && (
            <p className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Resposta incorreta. Tentativas restantes: {result.attemptsRemaining}
            </p>
          )}
          {blocked && (
            <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Numero maximo de tentativas excedido. Este match foi bloqueado por seguranca.
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading || blocked}>
            {loading ? "Verificando..." : "Confirmar resposta"}
          </button>
        </form>
      )}
    </div>
  );
}
