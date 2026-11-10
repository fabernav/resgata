// Erro com o status HTTP e o corpo da resposta, para a tela poder reagir a
// casos especificos (ex: 429 com "retryAfter" no login).
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: Record<string, unknown>,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    // Sem isso o navegador reaproveita GETs antigos e a tela mostra dados velhos.
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(extractErrorMessage(data.error), res.status, data);
  }

  return data as T;
}

// O erro vem como string ou como objeto de validacao do Zod.
function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const messages = Object.values(error as Record<string, string[]>).flat();
    if (messages.length > 0) return messages.join(" ");
  }

  return "Ocorreu um erro. Tente novamente.";
}
