# Dashboard de Disparos

Dashboard em tempo real que lê dados da sua planilha via n8n e mostra estatísticas de disparos (% entrou no grupo, % enviado, % pendente).

## Como funciona

```
Planilha Google Sheets → n8n (webhook) → Next.js no Vercel → Dashboard
```

Toda vez que a página é aberta (ou o botão ↻ é clicado), o dashboard busca os dados frescos do n8n, que lê a planilha na hora.

---

## Parte 1 — Configurar o n8n

Crie um novo workflow no n8n com 3 nós:

### Nó 1: Webhook
- **HTTP Method:** GET
- **Path:** `dashboard-stats` (ou o que você preferir)
- **Response Mode:** Last Node

Anote a URL de produção que o n8n te der. Ex: `https://webhook.trafegoedu.com.br/webhook/dashboard-stats`

### Nó 2: Google Sheets
- **Operation:** Get Row(s) in Sheet
- Selecione sua planilha e a aba
- Retorna todas as linhas

### Nó 3: Code (JavaScript)

Cole este código:

```javascript
const rows = $input.all();
const stats = {
  total: 0,
  entrou_grupo: 0,
  primeira_msg: 0,
  nao_mandou: 0,
  atualizado_em: new Date().toISOString()
};

for (const r of rows) {
  const status = String(r.json.status || '').trim().toLowerCase();
  stats.total++;
  if (status === 'entrou_grupo') stats.entrou_grupo++;
  else if (status === 'primeira_mensagem_enviada') stats.primeira_msg++;
  else if (status === 'nao mandou' || status === 'nao_mandou') stats.nao_mandou++;
}

return [{ json: stats }];
```

Ative o workflow. Teste chamando a URL no navegador — deve retornar algo como:
```json
{"total":847,"entrou_grupo":142,"primeira_msg":389,"nao_mandou":316,"atualizado_em":"..."}
```

---

## Parte 2 — Deploy no Vercel

### 2.1 — Subir no GitHub

```bash
git init
git add .
git commit -m "Dashboard inicial"
git remote add origin https://github.com/SEU_USUARIO/dashboard-disparos.git
git push -u origin main
```

### 2.2 — Importar no Vercel

1. Acesse https://vercel.com/new
2. Clique em "Import" no seu repositório
3. Na tela de configuração, expanda **Environment Variables** e adicione:
   - **Key:** `N8N_WEBHOOK_URL`
   - **Value:** a URL completa do seu webhook n8n (ex: `https://webhook.trafegoedu.com.br/webhook/dashboard-stats`)
4. Clique em **Deploy**

Pronto. Em ~1 minuto seu dashboard está no ar.

---

## Rodando localmente

```bash
cp .env.example .env.local
# edite .env.local e cole sua URL do webhook
npm install
npm run dev
```

Acesse http://localhost:3000

---

## Estrutura

```
app/
  api/stats/route.js   # proxy que chama o n8n (esconde a URL do navegador)
  layout.js            # shell da página
  page.js              # dashboard
  globals.css          # estilos base
```

## Personalização

- **Cores / fonte:** `app/globals.css` (variáveis CSS no `:root`)
- **Status da planilha:** se você usa nomes diferentes, ajuste o `code node` do n8n
- **Novos status:** adicione no n8n e no `app/page.js`
