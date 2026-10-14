import Link from "next/link";
import { ArrowRight, MapPin, PackageOpen, PackageX, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CATEGORY_LABELS } from "@/lib/categories";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [lostItems, foundItems, matches] = await Promise.all([

    prisma.lostItem.findMany({
      where: { userId: session.userId, status: { not: "RESOLVED" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.foundItem.findMany({
      where: { userId: session.userId, status: { not: "RESOLVED" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.findMany({
      where: {
        status: { not: "RESOLVED" },
        OR: [{ lostItem: { userId: session.userId } }, { foundItem: { userId: session.userId } }],
      },
      include: { lostItem: true, foundItem: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-fg">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Acompanhe seus itens e os matches sugeridos pelo sistema.</p>
      </header>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <h2 className="text-lg font-semibold text-fg">Matches Sugeridos</h2>
          <span className="pill border-subtle bg-surface-muted text-muted">{matches.length}</span>
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nenhum match ainda"
            description="Comece pelo feed publico: se encontrar um item parecido com o que voce perdeu, registre a perda e o motor de match cruza os dados sozinho."
            action={{ href: "/feed", label: "Ver o feed publico" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {matches.map((match) => {
              const souODono = match.lostItem.userId === session.userId;
              const jaVerificado = match.status === "VERIFIED" || match.status === "RESOLVED";

              const destino = jaVerificado
                ? `/matches/${match.id}/contact`
                : souODono
                  ? `/matches/${match.id}/verify`
                  : null; // quem achou so aguarda o dono responder

              const conteudo = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-fg">
                      {CATEGORY_LABELS[match.lostItem.category]}
                    </span>
                    <span className="pill border-brand/30 bg-brand/10 text-brand">{match.score} pts</span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {match.lostItem.location}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={match.status} />
                    <span className="text-xs text-muted">
                      {souODono ? "Voce perdeu este item" : "Voce achou este item"}
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-1 text-xs font-medium text-brand">
                    {destino ? (
                      <>
                        {jaVerificado ? "Ver contato" : "Responder verificacao"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <span className="text-muted">Aguardando o dono responder a verificacao</span>
                    )}
                  </p>
                </>
              );

              return destino ? (
                <Link key={match.id} href={destino} className="card block">
                  {conteudo}
                </Link>
              ) : (
                <div key={match.id} className="card">
                  {conteudo}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <PackageX className="h-4 w-4 text-muted" />
          <h2 className="text-lg font-semibold text-fg">Meus Itens Perdidos</h2>
          <span className="pill border-subtle bg-surface-muted text-muted">{lostItems.length}</span>
        </div>

        {lostItems.length === 0 ? (
          <EmptyState
            icon={PackageX}
            title="Nenhum item perdido registrado"
            description="Perdeu algo no campus? Registre aqui para que o sistema procure correspondencias automaticamente."
            action={{ href: "/items/lost/new", label: "Registrar item perdido" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {lostItems.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-fg">{CATEGORY_LABELS[item.category]}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.location}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <PackageOpen className="h-4 w-4 text-muted" />
          <h2 className="text-lg font-semibold text-fg">Meus Itens Achados</h2>
          <span className="pill border-subtle bg-surface-muted text-muted">{foundItems.length}</span>
        </div>

        {foundItems.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Nenhum item achado registrado"
            description="Encontrou algo pelo campus? Cadastre o item para ajudar o dono a recupera-lo."
            action={{ href: "/items/found/new", label: "Registrar item achado" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {foundItems.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-fg">{CATEGORY_LABELS[item.category]}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.location}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
