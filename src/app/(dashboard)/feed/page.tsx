import Link from "next/link";
import { Calendar, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toPublicFoundItemList } from "@/lib/serializers";
import { CATEGORY_LABELS } from "@/lib/categories";
import { EmptyState } from "@/components/EmptyState";
import { ItemPhoto } from "@/components/ItemPhoto";

interface FeedPageProps {
  searchParams: { category?: string; location?: string; date?: string };
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { category, location, date } = searchParams;

  const items = toPublicFoundItemList(
    await prisma.foundItem.findMany({
      where: {
        status: "AVAILABLE",
        ...(category ? { category: category as never } : {}),
        ...(location ? { location: { contains: location } } : {}),
        ...(date ? { foundDate: { gte: new Date(date) } } : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Search className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Feed Publico de Itens Achados</h1>
      </div>

      <form className="card mb-6 grid gap-3 sm:grid-cols-4" method="GET">
        <select name="category" defaultValue={category ?? ""} className="input">
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input name="location" placeholder="Local" defaultValue={location ?? ""} className="input" />
        <input name="date" type="date" defaultValue={date ?? ""} className="input" />
        <button type="submit" className="btn-primary">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtrar
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum item encontrado"
          description="Nao ha itens achados disponiveis com esses filtros. Tente ajustar a busca."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`} className="card block">
              {item.photoUrl && (
                <ItemPhoto src={item.photoUrl} desfocada={item.photoBlurred} className="mb-3 aspect-[4/3]" />
              )}
              <span className="text-sm font-semibold text-fg">{CATEGORY_LABELS[item.category]}</span>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                <MapPin className="h-3.5 w-3.5" />
                {item.location}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(item.foundDate).toLocaleDateString("pt-BR")}
              </p>
              <p className="mt-2 line-clamp-2 text-xs text-muted">{item.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
