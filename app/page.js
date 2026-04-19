'use client';

import { useEffect, useState, useCallback } from 'react';

function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 1000) / 10;
}

function fmt(n) {
  return Number(n || 0).toLocaleString('pt-BR');
}

function formatHora(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar');
      setData(json);
      setLastFetch(new Date().toISOString());
    } catch (e) {
      setError(e.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const d = data || { total: 0, entrou_grupo: 0, primeira_msg: 0, nao_mandou: 0 };
  const enviadosTotais = d.primeira_msg + d.entrou_grupo; // quem passou da etapa 1

  const pctSent    = pct(enviadosTotais, d.total);
  const pctJoined  = pct(d.entrou_grupo, d.total);
  const pctPending = pct(d.nao_mandou, d.total);
  const pctMsg     = pct(d.primeira_msg, d.total);

  // Taxa de conversão da etapa 1 -> grupo (quem recebeu msg e entrou)
  const pctGrupoSobreEnviados = pct(d.entrou_grupo, enviadosTotais);

  return (
    <main style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 20,
          marginBottom: 24,
          borderBottom: '1px solid var(--border)',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span className="live-dot" />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: error ? 'var(--red)' : 'var(--teal)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {loading
                ? 'Carregando...'
                : error
                ? 'Erro ao atualizar'
                : `Atualizado às ${formatHora(lastFetch)}`}
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-head)',
              fontWeight: 800,
              fontSize: 28,
              color: 'var(--white)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              margin: 0,
            }}
          >
            Painel de Disparos
          </h1>
        </div>

        <button
          onClick={load}
          disabled={loading}
          style={{
            background: 'transparent',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
            padding: '10px 18px',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            cursor: loading ? 'wait' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: loading ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          {loading ? '↻ Carregando...' : '↻ Atualizar'}
        </button>
      </header>

      {/* ── ERRO ── */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(255,74,74,0.08)',
            border: '1px solid rgba(255,74,74,0.3)',
            borderRadius: 10,
            marginBottom: 20,
            color: 'var(--red)',
            fontSize: 13,
          }}
        >
          <strong>Erro:</strong> {error}
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
            Verifique se a variável <code>N8N_WEBHOOK_URL</code> está configurada corretamente no Vercel e se o workflow do n8n está ativo.
          </div>
        </div>
      )}

      {/* ── CARDS DE MÉTRICA ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <MetricCard
          label="Total na base"
          value={fmt(d.total)}
          sub="contatos"
          color="var(--text2)"
        />
        <MetricCard
          label="1ª msg enviada"
          value={fmt(d.primeira_msg)}
          sub={`${pctMsg.toFixed(1)}% do total`}
          color="var(--gold)"
        />
        <MetricCard
          label="Entrou no grupo"
          value={fmt(d.entrou_grupo)}
          sub={`${pctJoined.toFixed(1)}% conversão`}
          color="var(--teal)"
        />
        <MetricCard
          label="Não enviado"
          value={fmt(d.nao_mandou)}
          sub={`${pctPending.toFixed(1)}% pendente`}
          color="var(--red)"
        />
      </div>

      {/* ── FUNIL + DONUT ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 14,
        }}
      >
        {/* FUNIL */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text2)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 18,
            }}
          >
            Funil de conversão
          </div>

          <FunnelBar
            label="Base total"
            valor={d.total}
            pct={100}
            cor="var(--text2)"
          />
          <FunnelBar
            label="1ª msg enviada"
            valor={enviadosTotais}
            pct={pctSent}
            cor="var(--gold)"
          />
          <FunnelBar
            label="Entrou no grupo"
            valor={d.entrou_grupo}
            pct={pctJoined}
            cor="var(--teal)"
          />

          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid var(--border)',
              fontSize: 12,
              color: 'var(--text2)',
            }}
          >
            Dos que receberam a 1ª mensagem,{' '}
            <strong style={{ color: 'var(--teal)' }}>
              {pctGrupoSobreEnviados.toFixed(1)}%
            </strong>{' '}
            entraram no grupo.
          </div>
        </div>

        {/* DONUT + LEGENDA */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text2)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 16,
            }}
          >
            Distribuição de status
          </div>

          <Donut
            slices={[
              { label: 'Entrou no grupo', valor: d.entrou_grupo, cor: '#00c9b1' },
              { label: '1ª msg enviada',  valor: d.primeira_msg, cor: '#f5c842' },
              { label: 'Não enviado',     valor: d.nao_mandou,   cor: '#ff4a4a' },
            ]}
            total={d.total}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 18,
              fontSize: 13,
            }}
          >
            <LegendRow cor="#00c9b1" label="Entrou no grupo" valor={d.entrou_grupo} pct={pctJoined} />
            <LegendRow cor="#f5c842" label="1ª msg enviada"  valor={d.primeira_msg} pct={pctMsg} />
            <LegendRow cor="#ff4a4a" label="Não enviado"     valor={d.nao_mandou}   pct={pctPending} />
          </div>
        </div>
      </div>

      {/* ── RODAPÉ ── */}
      <div
        style={{
          marginTop: 24,
          padding: '12px 16px',
          background: 'rgba(0,201,177,0.05)',
          border: '1px solid rgba(0,201,177,0.15)',
          borderRadius: 8,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text2)',
          textAlign: 'center',
          letterSpacing: '0.05em',
        }}
      >
        Os dados são lidos diretamente da planilha via n8n · clique em ↻ para atualizar
      </div>

      {/* ── ANIMAÇÃO DO PONTINHO VERDE ── */}
      <style jsx global>{`
        .live-dot {
          width: 7px;
          height: 7px;
          background: ${error ? 'var(--red)' : 'var(--teal)'};
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.8s ease infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
      `}</style>
    </main>
  );
}

/* ── COMPONENTES ── */

function MetricCard({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: color,
        }}
      />
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text2)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-head)',
          fontWeight: 800,
          fontSize: 32,
          color,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{sub}</div>
    </div>
  );
}

function FunnelBar({ label, valor, pct, cor }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: cor,
          }}
        >
          {fmt(valor)} · {pct.toFixed(1)}%
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--surface2)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, pct))}%`,
            background: cor,
            borderRadius: 4,
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  );
}

function LegendRow({ cor, label, valor, pct }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
        <span
          style={{
            width: 10, height: 10,
            borderRadius: 2,
            background: cor,
          }}
        />
        {label}
      </span>
      <span
        style={{
          color: 'var(--white)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
      >
        {fmt(valor)} · {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// Donut SVG puro (sem dependências externas)
function Donut({ slices, total }) {
  const size = 180;
  const r = 70;
  const strokeW = 22;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let acc = 0;
  const safeTotal = total || 1;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--surface2)"
          strokeWidth={strokeW}
        />
        {slices.map((s, i) => {
          const frac = (s.valor || 0) / safeTotal;
          const len = frac * circ;
          const offset = circ - acc;
          acc += len;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.cor}
              strokeWidth={strokeW}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
        })}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle"
          fill="var(--white)"
          fontFamily="var(--font-head)"
          fontSize="24"
          fontWeight="800"
        >
          {fmt(total)}
        </text>
        <text
          x={cx} y={cy + 16}
          textAnchor="middle"
          fill="var(--text2)"
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="1"
        >
          TOTAL
        </text>
      </svg>
    </div>
  );
}
