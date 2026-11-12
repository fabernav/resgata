import { CheckCheck, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CATEGORY_LABELS } from "@/lib/categories";
import { EmptyState } from "@/components/EmptyState";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) return null;

  const resolvedMatches = await prisma.match.findMany({
    where: {
      status: "RESOLVED",
      OR: [{ lostItem: { userId: session.userId } }, { foundItem: { userId: session.userId } }],
    },
    include: { lostItem: true, foundItem: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <History className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Historico de Casos Resolvidos</h1>
      </div>

      {resolvedMatches.length === 0 ? (
        <EmptyState
          icon={CheckCheck}
          title="Nenhum caso resolvido ainda"
          description="Quando um match for verificado e a devolucao confirmada por ambas as partes, ele aparece aqui."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resolvedMatches.map((match) => (
            <div key={match.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-fg">
                  {CATEGORY_LABELS[match.lostItem.category]}
                </span>
                <span className="pill border-subtle bg-surface-muted text-muted">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Resolvido
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                Perdido em {match.lostItem.location} - Achado em {match.foundItem.location}
              </p>
              <p className="mt-1 text-xs text-muted">
                Resolvido em {match.updatedAt.toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
