"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp, Loader2, X } from "lucide-react";

// capture="environment" abre a camera traseira direto no celular, por isso ha
// dois botoes (camera e galeria). No computador o capture e ignorado.

const LADO_MAXIMO = 900;
const QUALIDADE = 0.72;

// Uma foto de celular tem 3-8 MB; depois disso fica em torno de 60-120 KB.
async function prepararImagem(arquivo: File): Promise<string> {
  const bitmap = await createImageBitmap(arquivo);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Nao foi possivel processar a imagem");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", QUALIDADE);
}

interface PhotoInputProps {
  value: string | null;
  onChange: (foto: string | null) => void;
  ajuda?: string;
}

export function PhotoInput({ value, onChange, ajuda }: PhotoInputProps) {
  const inputCamera = useRef<HTMLInputElement>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    // permite escolher o mesmo arquivo de novo
    e.target.value = "";
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }

    setErro(null);
    setProcessando(true);
    try {
      onChange(await prepararImagem(arquivo));
    } catch {
      setErro("Nao foi possivel ler essa imagem. Tente outra.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div>
      <span className="label">Foto (opcional)</span>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Foto escolhida" className="block max-h-56 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            aria-label="Remover foto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputCamera.current?.click()}
            disabled={processando}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-subtle bg-surface-muted px-3 py-3 text-sm text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Tirar foto
          </button>
          <button
            type="button"
            onClick={() => inputArquivo.current?.click()}
            disabled={processando}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-subtle bg-surface-muted px-3 py-3 text-sm text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
          >
            <ImageUp className="h-4 w-4" />
            Escolher arquivo
          </button>
        </div>
      )}

      <input
        ref={inputCamera}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={aoEscolher}
        className="hidden"
      />
      <input ref={inputArquivo} type="file" accept="image/*" onChange={aoEscolher} className="hidden" />

      {erro ? (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{erro}</p>
      ) : (
        ajuda && <p className="mt-1.5 text-xs text-muted">{ajuda}</p>
      )}
    </div>
  );
}
