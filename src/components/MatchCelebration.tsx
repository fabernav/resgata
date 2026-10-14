"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMarkAnimada } from "@/components/Logo";

export function MatchCelebration({
  total,
  melhorPontuacao,
  onFechar,
}: {
  total: number;
  melhorPontuacao: number;
  onFechar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 motion-safe:animate-[fade_.25s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-match"
    >
      <div className="w-full max-w-sm rounded-2xl border border-subtle bg-surface p-6 text-center shadow-xl motion-safe:animate-[pop_.4s_cubic-bezier(.2,.9,.3,1.2)]">
        <LogoMarkAnimada className="mx-auto mb-2 h-28 w-28 text-brand" modo="uma-vez" />

        <h2 id="titulo-match" className="text-2xl font-bold tracking-tight text-fg">
          {total === 1 ? "Encontramos um match!" : `Encontramos ${total} matches!`}
        </h2>

        <p className="mt-2 text-sm text-muted">
          {total === 1
            ? "O sistema cruzou seu cadastro com a base e achou uma correspondencia."
            : "O sistema cruzou seu cadastro com a base e achou correspondencias."}
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
          {melhorPontuacao} pontos de compatibilidade
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link href="/dashboard" onClick={onFechar} className="btn-primary w-full">
            Ver o match
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl px-4 py-2 text-sm text-muted transition-colors hover:text-fg"
          >
            Agora nao
          </button>
        </div>
      </div>
    </div>
  );
}
