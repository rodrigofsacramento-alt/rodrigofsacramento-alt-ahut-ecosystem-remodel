# ✅ GAP REPORT — Prioridades (Ciclo de investigação — 23/08/2026)

**Autor:** Jarvis (com apoio de ATOM/ADA/AURA)
**Alvo:** páginas priorizadas pelo comandante (Atendimento, Leads, Agenda, Corretores, Financeiro, Notificações, Dashboard)

## 🎯 ACHADO TRANSVERSAL (maior gap de todos)
**Quase nenhuma página de prioridade consulta dados reais do Supabase.** As UIs foram engenheiradas (visual e layout), mas a **camada de dados está desconectada/mock**.

| Página | loc | P/BD (.from/.rpc) | hooks de dados | Status real |
| :--- | :---: | :---: | :--- | :--- |
| Atendimento | 986 | ✓ conversas/mensagens/leads | useWhatsapp,useLeads,useAgents,useVisits | 🟡 conectado + modo DEMO (QR não escaneado) |
| **Leads** | 388 | **0** | — | ❌ **MOCK puro** (nomes hardcoded: Carla Dias, Rodrigo Sacramento...) |
| **Agenda** | 305 | 1 | useAuth | ⚠️ quase mock |
| **Corretores** | 141 | 0 | useAgents | ⚠️ usa hook, mas sem .from próprio |
| **Financeiro** | 150 | **0** | — | ❌ **MOCK puro** |
| **Notificações** | 307 | 4 | useAuth | 🟢 parcialmente conectado (notifications) |
| **Dashboard** | 283 | **0** | — | ❌ **MOCK puro** (dados estáticos) |

## 📋 GAPs específicos por página

### LEADS (prioridade 2) — ❌ mock puro
- Produção (`Leads-DT8J3IsW.js`): tabelas `leads` + `lead_timeline`; funções: **Assumir Lead**, mover estágio no funil, **Cadastrar Lead**, **Editar Dados**, adicionar nota/histórico, filtros por estágio/corretor, busca por nome/email/telefone, KPIs (Ativos no funil, Convertidos).
- Reversa: tela estática, dados mock, NENHUMA query.
- **Correção:** usar o hook `useLeads` (já existe em src/hooks/useLeads.ts) + `lead_timeline`. Implementar Assumir Lead, mover estágio, cadastrar, nota/histórico.

### AGENDA (prioridade 3) — ⚠️ quase mock
- Produção (`Agenda-DW6P8p1e.js`): agendamentos de visitas, calendário, status, sincronização.
- Reversa: 1 query só, sem fluxo completo.
- **Correção:** integrar `useVisits` (existe) + `agenda_events`; CRUD de agendamento.

### CORRETORES (prioridade 4) — ⚠️ usa hook mas incompleto
- Produção (`Corretores-BmndtoCN.js`): **Evolução de Metas, Ranking, Performance, Comparativo realizado vs meta**, cadastro de novo corretor (CRECI, senha), pesos por lead/proposta, conversão.
- Reversa (`Corretores.tsx`, 141 loc): usa `useAgents` mas SEM as metas/ranking/performance/progress charts.
- **Correção:** adicionar metas/ranking/performance (recharts), formulário de cadastro completo (RPC `create_agent_user` já existe no hook useAgents.ts).

### FINANCEIRO (prioridade 5) — ❌ mock puro
- Produção (`Financeiro-CR-5dYTi.js`): fluxo de caixa, recebíveis, comissões, repasses, VGV.
- Reversa: transações hardcoded (Comissão Venda CTR-15243).
- **Correção:** integrar tabelas reais (comissões/recebíveis) + KPIs.

### NOTIFICAÇÕES (prioridade 6) — 🟢 parcial
- Já usa `notifications` (insert/update/delete). Completar fluxos.

### DASHBOARD (prioridade 7) — ❌ mock puro
- Produção (`Index-*/SuperAdminDashboard`): KPIs em tempo real, gráficos de conversão, funil de vendas.
- Reversa: dados estáticos.
- **Correção:** integrar agregações reais (Apollo sugere usar funções RPC p/ agregação, não processar milhares no frontend).

## 🛠️ PRÓXIMOS PASSOS (sequência de implementação)
Os gaps em verde/amarelo (Atendimento, Notificações, Agenda, Corretores) são prioritários por serem os que mais afetam operação. Leads/Financeiro/Dashboard são refatoração de dados. Executar na ordem de prioridade informada, validando build (tsc+vite) após cada entrega.