import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { motivoDeTrava } from "@/lib/item-management";
import { BackLink } from "@/components/BackLink";
import { FoundItemForm } from "@/components/FoundItemForm";

export default async function EditFoundItemPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const item = await prisma.foundItem.findUnique({ where: { id: params.id }, include: { matches: true } });

  // So o dono chega aqui, entao e seguro preencher a pergunta e a resposta
  // secretas (foi ele mesmo quem escreveu). Para os outros: "nao encontrado".
  if (!session || !item || item.userId !== session.userId) notFound();

  const trava = motivoDeTrava(item);

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/dashboard" label="Voltar ao dashboard" />
      <div className="mb-6 flex items-center gap-2">
        <Pencil className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Editar Item Achado</h1>
      </div>

      {trava ? (
        <div className="card text-sm text-muted">{trava}</div>
      ) : (
        <FoundItemForm
          initial={{
            category: item.category,
            color: item.color,
            location: item.location,
            foundDate: item.foundDate.toISOString().slice(0, 10),
            description: item.description,
            photoUrl: item.photoUrl,
            photoBlurred: item.photoBlurred,
            secretQuestion: item.secretQuestion,
            secretAnswer: item.secretAnswer,
          }}
          endpoint={`/api/found-items/${item.id}`}
          method="PATCH"
          submitLabel="Salvar alteracoes"
          loadingLabel="Salvando..."
        />
      )}
    </div>
  );
}
