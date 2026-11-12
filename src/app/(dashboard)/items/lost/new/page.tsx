"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PackageX } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { LostItemForm, lostItemVazio } from "@/components/LostItemForm";

// useSearchParams precisa de um limite de Suspense no App Router.
export default function NewLostItemPage() {
  return (
    <Suspense fallback={null}>
      <FormularioItemPerdido />
    </Suspense>
  );
}

function FormularioItemPerdido() {
  // Preenchido pelo botao "Perdi um item parecido" na tela de um item achado.
  const params = useSearchParams();
  const initial = {
    ...lostItemVazio,
    category: params.get("category") ?? lostItemVazio.category,
    color: params.get("color") ?? lostItemVazio.color,
    location: params.get("location") ?? lostItemVazio.location,
  };

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/dashboard" label="Voltar ao dashboard" />
      <div className="mb-6 flex items-center gap-2">
        <PackageX className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Registrar Item Perdido</h1>
      </div>
      <LostItemForm
        initial={initial}
        endpoint="/api/lost-items"
        method="POST"
        submitLabel="Registrar item perdido"
        loadingLabel="Registrando..."
      />
    </div>
  );
}
