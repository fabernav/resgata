import { EyeOff } from "lucide-react";

// A foto e nitida por padrao: ela serve para reconhecer, e a pergunta de
// verificacao cobra algo que a foto NAO mostra.
export function ItemPhoto({
  src,
  desfocada,
  className = "",
  alt = "Foto do item",
}: {
  src: string;
  desfocada: boolean;
  className?: string;
  alt?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-subtle ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`block h-full w-full object-cover ${desfocada ? "blur-md scale-105" : ""}`}
      />
      {desfocada && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white">
          <EyeOff className="h-3 w-3" />
          Desfocada por quem achou
        </span>
      )}
    </div>
  );
}
