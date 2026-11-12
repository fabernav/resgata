import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { motivoDeTrava } from "@/lib/item-management";
import { BackLink } from "@/components/BackLink";
import { LostItemForm } from "@/components/LostItemForm";

export default async function EditLostItemPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const item = await prisma.lostItem.findUnique({ where: { id: params.id }, include: { matches: true } });

  // Item de outra pessoa aparece como "nao encontrado", sem confirmar que existe.
  if (!session || !item || item.userId !== session.userId) notFound();

  const trava = motivoDeTrava(item);

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/dashboard" label="Voltar ao dashboard" />
      <div className="mb-6 flex items-center gap-2">
        <Pencil className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Editar Item Perdido</h1>
      </div>

      {trava ? (
        <div className="card text-sm text-muted">{trava}</div>
      ) : (
        <LostItemForm
          initial={{
            category: item.category,
            color: item.color,
            location: item.location,
            lostDate: item.lostDate.toISOString().slice(0, 10),
            description: item.description,
            photoUrl: item.photoUrl,
          }}
          endpoint={`/api/lost-items/${item.id}`}
          method="PATCH"
          submitLabel="Salvar alteracoes"
          loadingLabel="Salvando..."
        />
      )}
    </div>
  );
}
