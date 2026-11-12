"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

// Botoes "Editar" e "Excluir" dos cards de "Meus itens" no dashboard.
export function ItemActions({ tipo, id }: { tipo: "lost" | "found"; id: string }) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = tipo === "lost" ? `/api/lost-items/${id}` : `/api/found-items/${id}`;

  async function excluir() {
    const aviso =
      tipo === "lost"
        ? "Excluir este item perdido? Os matches sugeridos para ele tambem serao removidos."
        : "Excluir este item achado? Quem estava com match neste item deixara de ve-lo.";
    if (!window.confirm(aviso)) return;

    setError(null);
    setExcluindo(true);
    try {
      await apiFetch(api, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
      setExcluindo(false);
    }
  }

  return (
    <div className="mt-3 border-t border-subtle pt-3">
      <div className="flex items-center gap-4 text-xs font-medium">
        <Link href={`/items/${tipo}/${id}/edit`} className="flex items-center gap-1 text-brand hover:underline">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Link>
        <button
          type="button"
          onClick={excluir}
          disabled={excluindo}
          className="flex items-center gap-1 text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {excluindo ? "Excluindo..." : "Excluir"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
