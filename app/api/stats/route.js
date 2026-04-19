// Proxy server-side: esconde a URL do n8n do navegador
// e permite adicionar cabeçalhos/autenticação se precisar no futuro.

export const dynamic = 'force-dynamic'; // nunca cachear

export async function GET() {
  const url = process.env.N8N_WEBHOOK_URL;

  if (!url) {
    return Response.json(
      { error: 'N8N_WEBHOOK_URL não configurada' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return Response.json(
        { error: `n8n retornou ${res.status}` },
        { status: 502 }
      );
    }

    const raw = await res.json();

    // O n8n pode retornar { ... } ou [{ ... }]. Normaliza.
    const data = Array.isArray(raw) ? raw[0] : raw;

    return Response.json({
      total:         Number(data.total)         || 0,
      entrou_grupo:  Number(data.entrou_grupo)  || 0,
      primeira_msg:  Number(data.primeira_msg)  || 0,
      nao_mandou:    Number(data.nao_mandou)    || 0,
      atualizado_em: data.atualizado_em || new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      { error: 'Falha ao conectar no n8n', detail: String(err) },
      { status: 502 }
    );
  }
}
