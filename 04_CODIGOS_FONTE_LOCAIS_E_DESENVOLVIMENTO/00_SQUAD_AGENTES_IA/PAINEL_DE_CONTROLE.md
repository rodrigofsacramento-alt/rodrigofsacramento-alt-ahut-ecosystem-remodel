# 📊 Painel de Controle Consolidado do Squad IA

**Última Atualização:** 23/08/2026 (Ciclo 2 de Implementação — Jarvis Hermes)  
**Ambiente Ativo:** Local Dev Server (`http://localhost:5173`) | Repo: `ahut-ecosystem-remodel`

## ✅ PROGRESSO CICLO 2 — IMPLEMENTAÇÃO (páginas novas + conexão a dados)
- ✅ **Jurídico** (`/juridico`) — criada, rota+nav, build ok. [commit c6e77ac/452d4a7]
- ✅ **Comissões** (`/comissoes`) — criada (agent_commissions/commission_rules, faixas, câmbio), build ok. [452d4a7]
- ✅ **GestãoClientes** (`/clientes`) — criada, rota+nav, build ok. [452d4a7]
- ✅ **Marketing** (`/marketing`) — criada (alcance vs engajamento, mídias, integrações), build ok. [452d4a7]
- ✅ **Atendimento** — modo DEMO (fallback conversas/msgs quando WhatsApp não escaneado) p/ auditoria de UI. [a88fd14]
- ✅ **Leads** — conectado ao Supabase (useLeads/useCreateLead/useUpdateLead): Assumir Lead, mover estágio, cadastrar real. [052db56]
- 🔄 **Financeiro** — refatoração p/ dados (agente em execução)
- 🔄 **Dashboard** — refatoração p/ dados (agente em execução)
- 📄 **GAP REPORT PRIORIDADES** — descoberta: Leads/Financeiro/Dashboard eram MOCK puro; sem dados reais. [f085c76]

## 🎯 PRÓXIMAS FALTAS (de produção, ainda sem TSX reverso)
- **Área do Cliente** (`/area-cliente`) — portal do cliente
- **CorretorDashboard** — resumo do corretor (metas/ranking)
- **SuperAdmin*** (Users, Tenants, Plans, Subscriptions, Financial, Health, Audit, Communications, PortalIntegrations, Settings, Dashboard, Login, Layout) — gestão do sistema

---

## 🚨 INCIDENTE EM PRODUÇÃO — RECLAMAÇÕES DA DENISSE (Central de Atendimento)
> Relato da usuária (23/08): (1) não vê quem responde no grupo; (2) muitas mensagens como "arquivo indisponível"; (3) não vê todos os contatos; (4) não consegue chamar contato no privado pelo sistema.
> **Observação do comandante:** estas falhas afetam a PRODUÇÃO (não só o protótipo TSX).
> **Responsável (ATLAS):** diagnóstico de causa-raiz em andamento (artefatos: patch_broker_groups.mjs, build_group_sidebar_v7.mjs, update_participant_loader.mjs, chunks de produção Atendimento).
> **MAIOR GAP verificado localmente:** código reverso NÃO usa as RPCs de produção `accept_conversation`, `mark_conversation_read`, `transfer_conversation`, `ignore_conversation`, `update_client_contact` (essenciais p/ fila/aceite/transferência e chamada no privado).

---

---

## 🚦 Status Atual dos Agentes

| Agente | Papel | Status | Porta/URL | Última Entrega |
| :--- | :--- | :---: | :---: | :--- |
| **🛠️ ATOM** | Fullstack & DevOps | 🟢 **Aguardando Fase 3** | `5175` | Refatoração UI Propostas |
| **👩‍💼 AVA** | Triagem & Intake IA | 🟢 **Ativa** | N/A | Roteiro de Entrevista Imobiliária |
| **👑 JARVIS** | Orquestrador Chief | 🟢 **Monitorando** | N/A | Sincronização do Squad |
| **👁️‍🗨️ ARGUS** | Scrum Master | 🟢 **Fechamento Sprint 3** | N/A | Conclusão Fase 2 |
| **🎨 ADA** | Frontend UI/UX | 🟢 **Aguardando Fase 3** | N/A | Refatoração UI Atendimento |
| **🕵️ AURA** | QA Tester | 🟢 **Validado Localmente** | N/A | Prints Automáticos 5175 |
| **🛡️ AEGIS** | SecOps | 🟢 **Aguardando Fase 3** | N/A | RBAC em Agenda (Mock) |
| **📊 APOLLO**| Data Analyst | 🟢 **Em Espera** | N/A | Aguardando Vendas |
| **👁️ ARIA** | Monitor de Leads | 🟢 **Ativa** | N/A | Vigia no Banco de Dados |
| **🌐 ATLAS** | Infra & Integrações | 🟢 **Em Espera** | N/A | - |

## 📋 Kanban Engenharia Reversa (Fase 2 - Sprints 2 e 3)
- [x] Extração Lógica `Configuracoes.js` e Componentização TSX (Sprint 2)
- [x] Implementar Filtro Visual de Grupos em Leads (Sprint 3)
- [x] Refinar Design e Atalhos de Agendamento da Central de Atendimento (Sprint 3)
- [x] Implementar RBAC e Modais em Agenda (Sprint 3)
- [x] Implementar UI de Dashboard em Propostas (Sprint 3)
- [ ] Engenharia Reversa - Módulo Jurídico (Fase 3)
- [ ] Refatoração Página `Corretores.tsx` (Fase 3)

| Status | Ticket | Origem | Agente Envolvido |
| :---: | :--- | :--- | :--- |
| 🟢 | Sprint 3 - Atendimento, Agenda, Propostas, Leads | Engenharia TSX | **Atom & Ada** |
| 🟢 | Teste e Build da Sprint 3 | QA | **Aura** (Validado 100%) |
| ⚪ | Refatoração Página `Corretores.tsx` | Backlog Fase 3 | **Squad** |
| ⚪ | Refatoração Página `Jurídico` | Backlog Fase 3 | **Squad** |

## 🚨 Último Alerta (AURA)
> **[BLOCKER] - Build Vite falhou!**
> "Atom e Ada, o componente Vendas.tsx tem importações inexistentes (`../types/supabase`, `ConfirmDialog`, `Avatar`). A build quebrou! **Não autorizo o deploy local**. Corrijam as dependências antes de prosseguir."

---

## 📜 Histórico Recente de Tasks

| Task | Descrição | Status | Detalhes |
| :--- | :--- | :---: | :--- |
| **TASK-008** | Inclusão do Campo de Contexto de Problema | Adição de um campo global "Contexto do Problema" na estrutura dos tickets. O ticket TCK-2026-086 teve o solicitante alterado para Denisse e seu respectivo contexto do incidente do Wesley documentado no React. | ✅ CONCLUÍDO | Ambiente Local Atualizado |
| **TASK-007** | Modal Expandido para Subtickets & Inteligência Compartilhada | Modificação do React (TicketDetailModal) para renderizar o painel expansível de Subtickets com seus devidos estágios (a executar, validando, executado). Atualização das regras nas skills do ATOM, AVA e ORQUESTRADOR assumindo que cada subticket é um deploy/update de sistema. | ✅ CONCLUÍDO | Código React Refatorado |
| **TASK-006** | Estruturação de Subtickets e Resolução Incidente Wesley | Implementação da estrutura UI de pré-requisitos, atualização das métricas dos 3 agentes (ATOM, AVA, ORQUESTRADOR), e adição do Ticket TCK-2026-086 com 10 subtickets | ✅ CONCLUÍDO | Ambiente Local Atualizado |
| **TASK-005** | Carregamento das Últimas 800 Mensagens nos Grupos | Ajuste da consulta do histórico para `created_at desc limit 800` + reverse (exibição em tempo real de mensagens de grupos densos) | ✅ CONCLUÍDO | Deployado na Hostinger |
| **TASK-004** | Restrição de Acesso à Conexão WhatsApp | Engrenagem e QR Code restritos exclusivamente a Admins (v8 deployado) | ✅ CONCLUÍDO | Hostinger SFTP OK |
| **TASK-003** | Resolução Lead Maria Ferreira & Blindagens | ✅ CONCLUÍDO | Queries PostgREST corrigidas, processo zumbi eliminado |
| **TASK-002** | Criação da Agente AVA (Intake/Triagem) | ✅ CONCLUÍDO | Skill & Estrutura Ativa em `.agents/skills/ava-agent-intake` |
| **TASK-001** | Organização do Agente ATOM no App | ✅ CONCLUÍDO | Centralização das pastas em `00_SQUAD_AGENTES_IA` |
| **HUB-ATLZ-1** | - [Atom, Ada, Jarvis, Aura] Engenharia Reversa - Página Configurações (Concluído)
- [Aura] Automação de QA Visual com Cypress/Playwright no frontend reverso (Concluído e Validado na Sprint 2) Corretor construído em React + Vite. |
| **HUB-ATLZ-2** | Atualização de Sistema | ✅ CONCLUÍDO | Filtro de pesquisa case-insensitive implementado na tela de leads. |
| **HUB-ATLZ-3** | Atualização de Sistema | ✅ CONCLUÍDO | Sistema de ordenação decrescente por data da última mensagem adicionado na tela [[Dashboard-do-Corretor]]. |
| **HUB-ATLZ-4** | Atualização de Sistema | ✅ CONCLUÍDO | Automação WhatsApp - Servidor `whatsapp-broker` online e funcional. |
| **HUB-ATLZ-5** | Atualização de Sistema | ✅ CONCLUÍDO | Integração Realtime entre o Baileys e o Supabase. |
| **HUB-ATLZ-6** | Atualização de Sistema | ✅ CONCLUÍDO | Correção do Bug "Agência Hut" implementando a verificação `isFromMe` documentada em [[Tratamento-de-Erros-Sessoes]]. |
| **HUB-ATLZ-7** | Atualização de Sistema | ✅ CONCLUÍDO | Lógica de desconexão e nova sessão do QR Code. |
| **HUB-ATLZ-8** | Atualização de Sistema | ✅ CONCLUÍDO | Inteligência e Estruturação - Inicialização do projeto Next. |
| **HUB-ATLZ-9** |
| **TASK-DEM-6** | Erro de envio de mensagem Column Net Does not Exist | ✅ CONCLUÍDO | O sistema gerava erro schema net ao tentar enviar. Resolvido desativando gatilho de webhook. |
| **TASK-DEM-1** | Separar telas de atendimento individuais e de grupos | ✅ CONCLUÍDO | Separar telas de atendimento individuais e de grupos. |
| **TASK-DEM-2** | Realizar teste de validação de recebimento de mensagem via grupo | ✅ CONCLUÍDO | Teste de validação de recebimento de mensagem via grupo com espelhamento. |
| **TASK-DEM-7** | Atualizar VPS 24/7 | ✅ CONCLUÍDO | Fazer rodar sistema de whatsapp em vps. |
| **TASK-DEM-8** | Testar mensagem de grupo | ✅ CONCLUÍDO | Fazer teste enviando mensagem e recebendo mensagem via sistema. | Atualização de Sistema | ✅ CONCLUÍDO | Criação do HUB central documentando todos os nossos [[Relatórios]]. |

---

## 🖼️ Validação Visual do Último Teste Local

O **ATOM** validou o layout e tirou um screenshot automático na porta `5174`:

![Último Teste Local](file:///Users/christianeracanelli/Desktop/Ahut%20Ecosystem/04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/00_SQUAD_AGENTES_IA/01_ATOM_DEVELOPER/ULTIMO_TESTE_LOCAL.png)

---

## 📋 Regras de Deploy em Produção
* 🔒 **Deploy na Hostinger (SFTP):** Bloqueado até aprovação manual.
* 🔒 **Deploy na VPS (SSH):** Bloqueado até aprovação manual.
* 🟢 **Ambiente Local de Testes:** Liberado em `http://localhost:5174/tecnologia`.
- [x] Task 5 - Removido o botão de Configurar WhatsApp (QR Code) para o usuário Jota no painel de Atendimento (Atendimento-live-v10.js) em produção.
- [x] TASK INCORPORAR ATUALIZAÇÕES EXECUTADAS: Rastreadas as demandas no DOCUMENTO_UNIFICADO_DEMANDAS.md e inseridas no frontend de Tecnologia.
