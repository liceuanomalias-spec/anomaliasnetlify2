// Robust JSON fetch helper — never throws cryptic "Unexpected end of JSON input"
// Always returns a clear, actionable error message.
//
// EXPO_PUBLIC_BACKEND_URL handling:
//   - undefined or empty string → same origin (useful for Netlify Functions deploy)
//   - URL string → that backend (useful for separate Render/Railway deploy)

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL || "";

export type ApiOk<T> = { ok: true; status: number; data: T };
export type ApiErr = { ok: false; status: number; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

export async function apiFetch<T = any>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const url = path.startsWith("http") ? path : `${BACKEND}${path}`;

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      error:
        "Não foi possível contactar o servidor. " +
        "Verifique a sua ligação à internet ou se o servidor está disponível. " +
        `(${e?.message || "network error"})`,
    };
  }

  const text = await res.text();
  if (!text) {
    return {
      ok: false,
      status: res.status,
      error:
        res.status === 0
          ? "O servidor não respondeu. Pode estar a iniciar (até 30s no primeiro pedido)."
          : `O servidor respondeu com status ${res.status} sem conteúdo. ` +
            "Se acabou de iniciar a aplicação, aguarde e tente novamente.",
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      status: res.status,
      error:
        `O servidor devolveu uma resposta inesperada (não é JSON). ` +
        `Verifique se o URL do backend está correto. ` +
        `Resposta: ${text.slice(0, 150)}`,
    };
  }

  if (!res.ok) {
    const detail = Array.isArray(parsed?.detail)
      ? parsed.detail[0]?.msg || JSON.stringify(parsed.detail[0])
      : parsed?.detail;
    return {
      ok: false,
      status: res.status,
      error: detail || `Pedido falhou com status ${res.status}.`,
    };
  }

  return { ok: true, status: res.status, data: parsed as T };
}

export const API_BASE = BACKEND;
