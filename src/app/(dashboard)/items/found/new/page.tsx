"use client";

import { PackageOpen } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { FoundItemForm, foundItemVazio } from "@/components/FoundItemForm";

export default function NewFoundItemPage() {
  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/dashboard" label="Voltar ao dashboard" />
      <div className="mb-6 flex items-center gap-2">
        <PackageOpen className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">Registrar Item Achado</h1>
      </div>
      <FoundItemForm
        initial={foundItemVazio}
        endpoint="/api/found-items"
        method="POST"
        submitLabel="Registrar item achado"
        loadingLabel="Registrando..."
      />
    </div>
  );
}
