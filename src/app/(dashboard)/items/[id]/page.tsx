import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Palette, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toPublicFoundItem } from "@/lib/serializers";
import { CATEGORY_LABELS } from "@/lib/categories";
import { StatusBadge } from "@/components/StatusBadge";
import { ItemPhoto } from "@/components/ItemPhoto";
import { BackLink } from "@/components/BackLink";

export default async function FoundItemDetailPage({ params }: { params: { id: string } }) {
  const found = await prisma.foundItem.findUnique({ where: { id: params.id } });
  if (!found) notFound();

  const item = toPublicFoundItem(found);

  const details = [
    { icon: Palette, label: "Cor", value: item.color },
    { icon: MapPin, label: "Local onde foi encontrado", value: item.location },
    { icon: Calendar, label: "Data", value: new Date(item.foundDate).toLocaleDateString("pt-BR") },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/feed" label="Voltar ao feed" />
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-brand" />
            <h1 className="text-xl font-bold tracking-tight text-fg">{CATEGORY_LABELS[item.category]}</h1>
          </div>
          <StatusBadge status={item.status} />
        </div>

        {item.photoUrl && <ItemPhoto src={item.photoUrl} desfocada={item.photoBlurred} className="aspect-[4/3]" />}

        <dl className="space-y-3 text-sm">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 text-muted" />
              <div>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="text-fg">{value}</dd>
              </div>
            </div>
          ))}
          <div>
            <dt className="text-xs text-muted">Descricao</dt>
            <dd className="mt-0.5 text-fg">{item.description}</dd>
          </div>
        </dl>

        <div className="rounded-xl bg-surface-muted p-4">
          <p className="text-xs text-muted">
            Acha que este item e seu? Registre o item perdido e o motor de match cruza os dados
            automaticamente. Se a pontuacao for alta, voce recebe o match e passa para a verificacao
            de posse.
          </p>
          <Link
            href={{
              pathname: "/items/lost/new",
              query: { category: item.category, color: item.color, location: item.location },
            }}
            className="btn-primary mt-3 w-full"
          >
            Perdi um item parecido
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
