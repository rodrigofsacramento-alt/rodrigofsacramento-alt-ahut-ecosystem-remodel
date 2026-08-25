# 📋 PLANO DE ENGENHARIA REVERSA — PRODUÇÃO → TSX LEGÍVEL

## Contexto
O código de produção do cliente (`ahut-ecosystem.apexfyhub.com.br`) existe em formato **micro-compilado** (JS minificado/empacotado). Precisamos resgatar a estrutura completa para código TypeScript legível, editável e escalável.

## O que temos hoje
- **Produção**: `index-C9-68P_N.js` (159KB) + `Atendimento-live-v10.js` (161KB) + HTML
- **Dev (engenharia reversa parcial)**: `src/` com componentes `.tsx` já parcialmente reconstruídos (Atendimento, Tecnologia, Gestão, etc.)

## O que PRECISA ser extraído da produção

### Prioridade 1 — Atendimento (WhatsApp/Grupos)
- Lógica de `isAgentSender` (como a produção determina lado esquerdo/direito)
- `sendMessage` RPC e fluxo de envio
- `group_participants` loader e sidebar de participantes
- Filtros de conversas (Meus, Equipe, Grupos, Não Lidas)
- Painel de Grupo com exibição de participantes
- Tags e gerenciamento de tags

### Prioridade 2 — Core App
- Autenticação (`useAuth`) e fluxo de login
- Sidebar com navegação e badges
- Header com breadcrumbs
- Hook `useWhatsapp` com todas as RPCs
- Hook `useAgents` com filtros

### Prioridade 3 — Demais páginas
- Dashboard (cards, gráficos, métricas)
- Leads (estágios, kanban, score)
- Agenda (calendário, eventos)
- Financeiro (transações, comissões)
- Tecnologia (kanban, tickets)
- Gestão (tarefas, kanban Chris)

## Agentes escalados

| Agente | Responsabilidade | Skill |
|---|---|---|
| **ATOM** (Dev Sênior) | Extrair lógica do bundle `index-C9-68P_N.js` → hooks, auth, componentes core | Backend/Frontend |
| **ADA** (Front-End UI) | Extrair `Atendimento-live-v10.js` → Atendimento completo + grupos | UI/UX + Supabase |
| **ATLAS** (DevOps) | Extrair schema do banco produção + RPCs + funções SQL | Infra/Banco |

## Fluxo de validação
1. Cada agente extrai um componente específico
2. Jarvis revisa e corrige (mentoria)
3. Build (`npm run build`) valida TypeScript
4. QR code escaneado no DEV para validar fluxo real
5. Só após validação → deploy na produção