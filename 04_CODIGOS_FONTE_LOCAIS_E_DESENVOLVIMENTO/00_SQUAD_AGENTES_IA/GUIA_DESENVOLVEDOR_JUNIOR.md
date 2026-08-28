# 🧑‍💻 GUIA DO DESENVOLVEDOR JÚNIOR — AMBIENTE ANTIGRAVITY

## ⚠️ REGRA ABSOLUTA: NUNCA MEXA NA PRODUÇÃO

**Você só tem acesso ao ambiente DEV (ANTIGRAVITY).**
**Qualquer alteração no sistema produtivo do cliente resultará em danos reais a leads, conversas e dados de clientes.**

```
🔥 PRODUÇÃO (cliente real) → BLOQUEADO para você
🧪 DEV / ANTIGRAVITY     → SEU AMBIENTE DE TRABALHO
```

---

## 📦 REPOSITÓRIOS

### DEV (seu ambiente) — `rodrigofsacramento-alt-ahut-ecosystem-remodel`
```
https://github.com/rodrigofsacramento-alt/rodrigofsacramento-alt-ahut-ecosystem-remodel.git
```
**Branch:** `main` — tudo que você commitar vai para o ambiente de teste.

### 🔴 PRODUÇÃO (NÃO TOCAR) — `ahut-ecosystem-active`
```
https://github.com/rodrigofsacramento-alt/ahut-ecosystem-active.git
```
**⚠️ NUNCA clone, modifique, ou faça deploy deste repositório.**
**⚠️ NUNCA use as credenciais do Supabase de produção.**
**⚠️ NUNCA use o broker da VPS do cliente (2.24.95.98).**

---

## 🧪 AMBIENTE ANTIGRAVITY — DADOS DE ACESSO

### Supabase DEV (banco de testes)
| Item | Valor |
|---|---|
| **URL** | `https://xmsulduzvufdzkfktovk.supabase.co` |
| **Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtc3VsZHV6dnVmZHprZmt0b3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTU1OTgsImV4cCI6MjEwMDkzMTU5OH0.TkfD8EKunyPKUFamym-OTUQIuBMUtgHnU_s2iixEHl0` |
| **Service Role** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtc3VsZHV6dnVmZHprZmt0b3ZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM1NTU5OCwiZXhwIjoyMTAwOTMxNTk4fQ.EhchaQ1GsUrwG1QyJih68EEa8ArxD439ocHup7LwNOg` |
| **DB Connection** | `postgresql://postgres:Dir%40124!%40%24!%40%24@db.xmsulduzvufdzkfktovk.supabase.co:6543/postgres` |

### Usuários de Teste (criados no Supabase DEV)
| Nome | Email | Senha | Cargo |
|---|---|---|---|
| Vilda Imóveis | `vilda@vildaimoveis.com` | `Vilda@2026!Fort` | admin |
| Chris Racanelli | `chris@vildaimoveis.com` | `Chris@2026!Fort` | admin |
| Rodrigo Sacramento | `sacramento@vildaimoveis.com` | `Sac@2026!Fort` | admin |
| Igor Supervisor | `igor@vildaimoveis.com` | `Igor@2026!Fort` | manager |
| Emilio Financeiro | `emilio@vildaimoveis.com` | `Emilio@2026!Fort` | agent |

### Frontend DEV
```
https://dev-ahut-ecosystem.apexfyhub.com.br/
```

### Deploy DEV (Hostinger)
```
Servidor: 82.25.73.206
Porta: 65002
Usuário: u817195350
Senha: Dir@5207411605
Pasta: /home/u817195350/domains/apexfyhub.com.br/public_html/dev/
```

---

## 🚀 FLUXO DE TRABALHO PASSO A PASSO

### 1. CLONAR O REPOSITÓRIO DEV
```bash
git clone https://github.com/rodrigofsacramento-alt/rodrigofsacramento-alt-ahut-ecosystem-remodel.git
cd rodrigofsacramento-alt-ahut-ecosystem-remodel
```

### 2. NAVEGAR ATÉ O CÓDIGO FONTE
```bash
cd "04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/ahut-ecosystem-active/codigo_engenharia_reversa_tsx"
```

### 3. INSTALAR DEPENDÊNCIAS
```bash
npm install
```

### 4. FAZER ALTERAÇÕES NO CÓDIGO
Edite os arquivos em `src/`:
- `src/pages/` — Páginas do sistema (Atendimento, Notificacoes, Login, etc.)
- `src/components/` — Componentes reutilizáveis (Dashboard, Layout, Cards, etc.)
- `src/hooks/` — Hooks personalizados
- `src/contexts/` — Contextos React (i18n, etc.)
- `src/lib/` — Utilitários e configurações (supabase.ts, utils.ts)
- `src/index.css` — Estilos globais e tokens de design

### 5. TESTAR LOCALMENTE
```bash
npm run dev
```
Isso sobe um servidor local em `http://localhost:5173/`

### 6. BUILDAR PARA PRODUÇÃO
```bash
npm run build
```
Os arquivos compilados vão para a pasta `dist/`.

### 7. FAZER DEPLOY NO AMBIENTE DEV
```bash
# Via SFTP (use FileZilla ou scp)
# Servidor: 82.25.73.206
# Porta: 65002
# Usuário: u817195350
# Senha: Dir@5207411605
# Pasta de destino: /home/u817195350/domains/apexfyhub.com.br/public_html/dev/

# Arquivos para enviar:
# - dist/index.html
# - dist/assets/ (todos os arquivos)
```

### 8. COMMITAR NO GITHUB
```bash
git add .
git commit -m "📝 descrição clara do que foi feito"
git push origin main
```

---

## 🛑 O QUE NUNCA FAZER (LISTA DE PROIBIÇÕES)

### 🔴 PROIBIDO — PRODUÇÃO
| Ação | Consequência |
|---|---|
| Usar Supabase `ptochsyoyatsydfysacc` | ALTERA dados reais de clientes |
| Acessar VPS `2.24.95.98` | DERRUBA o WhatsApp do cliente |
| Deploy em `ahut-ecosystem.apexfyhub.com.br` | QUEBRA o sistema em produção |
| Git push no repo `ahut-ecosystem-active` | ALTERA o código de produção |
| Usar senhas reais de clientes | EXPÕE dados sensíveis |
| Rodar broker localmente | PODE enviar mensagens para leads reais |

### 🟡 CUIDADO — Ambiente DEV
- O Supabase DEV tem schema IDÊNTICO ao de produção
- Os dados são gerados, mas NÃO são reais
- Commits no remodel afetam o frontend dev
- Deploy na pasta errada = não aparece no navegador

---

## 🏗️ ESTRUTURA DO PROJETO

```
codigo_engenharia_reversa_tsx/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   │   ├── Layout.tsx          # Sidebar + Header
│   │   ├── Dashboard.tsx       # Dashboard principal
│   │   ├── GlassNeonCard.tsx   # Cards com efeito neon
│   │   ├── NeuralBackground.tsx # Canvas neurônios
│   │   └── ...
│   ├── pages/          # Páginas do sistema
│   │   ├── Atendimento.tsx     # Chat WhatsApp
│   │   ├── Login.tsx           # Tela de login
│   │   ├── Notificacoes.tsx    # Central de notificações
│   │   └── ...
│   ├── hooks/          # Hooks personalizados
│   │   ├── useResponsive.ts    # Hook de responsividade
│   │   └── ...
│   ├── contexts/       # Contextos React
│   │   ├── LanguageContext.tsx  # i18n PT/ES
│   │   └── ...
│   ├── lib/            # Utilitários
│   │   ├── supabase.ts        # Conexão Supabase DEV
│   │   └── utils.ts           # Funções auxiliares
│   └── index.css       # Estilos globais
├── index.html          # HTML principal
├── package.json        # Dependências
└── vite.config.ts      # Config Vite
```

---

## 🎨 DESIGN SYSTEM VIGENTE

### Cores
| Token | Cor | Uso |
|---|---|---|
| `--neon-cyan` | `#00FFCC` | Acento principal, neurônios, glows |
| `--cyber-dark` | `#050505` | Fundo absoluto |
| `card-dark` | `rgba(255,255,255,0.04)` | Cards transparentes |
| `.glass-neon` | Vidro + blur | Containers e cards |
| `.neon-text` | `#00FFCC` + glow | Texto de destaque |

### Classes CSS Disponíveis
- `card-dark` — Card transparente com borda ciano
- `card-dark-stat` — Card de estatística
- `glass-neon` — Container vidro com blur
- `glass-neon-icon` — Ícone com vidro
- `neon-glow` — Sombra neon externa
- `neon-text` — Texto ciano com glow
- `btn-neon-ghost` — Botão ghost neon
- `tech-grid` — Grid radial subliminar
- `aura-neon` — Pseudo-elemento brilhante

### Componentes React
- `<GlassNeonCard>` — Card com ícone, título, descrição, ação
- `<GlassNeonIcon>` — Ícone com glow
- `<NeonGhostButton>` — Botão ghost neon

---

## 🔍 COMO SABER SE ESTÁ NO AMBIENTE CERTO?

### ✅ VERIFICADOR RÁPIDO
```javascript
// No código, o supabase.ts deve ter:
const supabaseUrl = 'https://xmsulduzvufdzkfktovk.supabase.co';  // ✅ DEV
// NÃO: https://ptochsyoyatsydfysacc.supabase.co  // ❌ PRODUÇÃO
```

### ✅ VERIFICADOR DE DEPLOY
```bash
# Após fazer deploy, acesse:
curl -sk https://dev-ahut-ecosystem.apexfyhub.com.br/ | head -5
# Deve mostrar: notranslate, lang="pt-BR"
```

### ❌ SINAIS DE PERIGO (se ver algo assim, PARE)
- URL: `ahut-ecosystem.apexfyhub.com.br` (sem `dev-`)
- Supabase: `ptochsyoyatsydfysacc.supabase.co`
- Servidor: `2.24.95.98` (VPS do cliente)
- Repositório: `ahut-ecosystem-active` (produção)

---

## 📞 CONTATOS DE EMERGÊNCIA

| Problema | Quem chamar |
|---|---|
| Dúvida sobre código | Comandante Rodrigo |
| Problema no deploy | Jarvis (agente IA) |
| Erro no Supabase DEV | Jarvis |
| Qualquer coisa sobre PRODUÇÃO | ⚠️ PARE IMEDIATAMENTE E CHAME O COMANDANTE |

---

**🚨 LEMBRE-SE: Uma única alteração na produção pode custar dados de clientes reais. Trabalhe apenas no DEV/ANTIGRAVITY.**