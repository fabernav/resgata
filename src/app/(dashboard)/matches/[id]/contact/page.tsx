"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCheck, CheckCircle2, Clock, Mail, Phone, User } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { BackLink } from "@/components/BackLink";
import { ItemPhoto } from "@/components/ItemPhoto";
import { CopyButton } from "@/components/CopyButton";

interface Contact {
  name: string;
  email: string;
  phone: string;
  papel: "ACHOU" | "PERDEU";
}

interface Confirmacao {
  euConfirmei: boolean;
  outroConfirmou: boolean;
  resolvido: boolean;
}

export default function MatchContactPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ contact: Contact; confirmacao: Confirmacao; photoUrl: string | null }>(
      `/api/matches/${params.id}/contact`,
    )
      .then((data) => {
        setContact(data.contact);
        setConfirmacao(data.confirmacao);
        setPhotoUrl(data.photoUrl);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar contato"))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleConfirmDelivery() {
    setConfirmando(true);
    setError(null);
    try {
      const data = await apiFetch<{ confirmacao: Confirmacao }>(
        `/api/matches/${params.id}/confirm`,
        { method: "POST" },
      );
      setConfirmacao(data.confirmacao);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar devolucao");
    } finally {
      setConfirmando(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="mx-auto max-w-md">
      <BackLink href="/dashboard" label="Voltar ao dashboard" />
      <div className="mb-6 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Contato Liberado</h1>
      </div>

      {error && <p className="card text-sm text-red-600 dark:text-red-400">{error}</p>}

      {contact && (
        <div className="card space-y-4">
          <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
            Verificacao concluida! Estes sao os dados de contato de quem{" "}
            {contact.papel === "ACHOU" ? "encontrou o seu item" : "perdeu o item que voce achou"}.
            Combinem a devolucao e confirmem aqui quando terminar.
          </p>

          {photoUrl && (
            <div>
              <ItemPhoto src={photoUrl} desfocada={false} className="aspect-[4/3]" />
              <p className="mt-1.5 text-xs text-muted">
                A foto aparece nitida porque a posse ja foi verificada.
              </p>
            </div>
          )}

          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2">
              <User className="h-4 w-4 flex-none text-muted" />
              <dd className="min-w-0 flex-1 truncate">{contact.name}</dd>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2">
              <Mail className="h-4 w-4 flex-none text-muted" />
              <dd className="min-w-0 flex-1 truncate">{contact.email}</dd>
              <CopyButton valor={contact.email} rotulo="e-mail" />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2">
              <Phone className="h-4 w-4 flex-none text-muted" />
              <dd className="min-w-0 flex-1 truncate">{contact.phone}</dd>
              <CopyButton valor={contact.phone} rotulo="telefone" />
            </div>
          </dl>

          {confirmacao?.resolvido ? (
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCheck className="h-4 w-4" />
                Caso resolvido!
              </p>
              <p className="mt-1 text-xs text-muted">
                As duas partes confirmaram. Este caso foi arquivado e agora aparece no seu Historico.
              </p>
              <Link href="/history" className="btn-primary mt-3 w-full">
                Ver no historico
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : confirmacao?.euConfirmei ? (
            <div className="rounded-xl bg-amber-500/10 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                Voce confirmou a devolucao
              </p>
              <p className="mt-1 text-xs text-muted">
                Falta a outra parte confirmar. Assim que ela confirmar, o caso e arquivado e vai para o
                Historico.
              </p>
            </div>
          ) : (
            <button onClick={handleConfirmDelivery} disabled={confirmando} className="btn-primary w-full">
              {confirmando ? "Confirmando..." : "Confirmar devolucao do item"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
