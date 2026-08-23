# ✅ GAP REPORT — Prioridades (Investigação FINAL — 23/08/2026)

**Autor:** Jarvis (com apoio de ATOM/ADA/AURA)
**Status:** RESOLVIDO — **7/7 páginas de prioridade conectadas a dados** (nenhuma mais mock puro).

## 🎯 ESTADO FINAL DO CICLO 2 (após nova investigação + implementação)

| Página | Qry/hook de dados | Status |
| :--- | :--- | :--- |
| **Atendimento** | useWhatsapp, useLeads, useVisits, useAgents + modo DEMO | 🟢 real (QR não escaneado → DEMO para auditoria) |
| **Leads** | useLeads / useCreateLead / useUpdateLead | 🟢 **conectado** (Assumir Lead, mover estágio, cadastrar) |
| **Agenda** | useAuth + query | 🟢 parcial (melhorar para useVisits em próximo ciclo) |
| **Corretores** | useAgents | 🟢 parcial (metas/ranking pendente de implementar) |
| **Financeiro** | useFinance (hook novo) | 🟢 **conectado** (fluxo, comissões, repasses, VGV) |
| **Notificações** | notifications (CRUD direto) | 🟢 real |
| **Dashboard** | useLeads / useSales / useVisits | 🟢 **conectado** (KPIs, funil, gráfico com fallback) |

## 📈 O que mudou desde a 1ª investigação
- **Leads**: era mock puro → agora usa hook useLeads real (Assumir Lead, mover estágio, cadastro).
- **Financeiro**: era mock puro → novo hook useFinance via useQuery.
- **Dashboard**: era mock puro (o único restante) → agora conectado a useLeads/useSales/useVisits com fallback.
- **Atendimento**: ganhou modo DEMO para auditar UI mesmo com WhatsApp não escaneado.

## 🎯 PRÓXIMAS FALTAS (não prioritárias — de produção, ainda sem TSX reverso)
- **Área do Cliente** (`/area-cliente`) — portal do cliente
- **CorretorDashboard** — resumo do corretor (metas/ranking)
- **SuperAdmin*** (Users, Tenants, Plans, Subscriptions, Financial, Health, Audit, Communications, PortalIntegrations, Settings, Dashboard, Login, Layout) — gestão do sistema

## 🛠️ REFINAMENTOS SUGERIDOS (próximo ciclo)
- **Corretores**: implementar metas individuais, ranking, performance (recharts) e formulário completo (RPC create_agent_user).
- **Agenda**: conectar a `useVisits` + CRUD completo de agendamento.
- **Atendimento**: implementar RPCs `accept_conversation`, `mark_conversation_read`, `transfer_conversation`, `ignore_conversation` (fila/aceite/transferência) — liga as queixas da Denisse à paridade com produção.

*(Documentos relacionados: DIAGNOSTICO_DENISSE.md, KNOWLEDGE_BASE.md, PAINEL_DE_CONTROLE.md, ORQUESTRACAO_CICLO1.md)*