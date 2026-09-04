# 📊 Painel de Controle Consolidado do Squad IA

**Última Atualização:** 03/09/2026 (Ciclo 5 — Zombie dupla-montagem + push código + Funil de Performance)  
**Ambiente Ativo:** Produção (`ahut-ecosystem.apexfyhub.com.br`) | Repo: `rodrigofsacramento-alt-...-remodel` (branch `remodel`, docroot `/ahut/`)  
**Dev Subdomínio:** `https://dev-ahut-ecosystem.apexfyhub.com.br` ✅ Funcionando (SPA routing fix)  

## ✅ PROGRESSO CICLO 5 — ZOMBIE DUPLA-MONTAGEM DO LOGIN (03/09) — RESOLVIDO
- ✅ **Push GitHub** — commits `b69dfaa` (filtro atendentes) / `1722d54` (filtro admin-only) confirmados no remote `origin/remodel`. Filtro de atendentes 100% funcional no PROD (sha `55cd3037`, `Atendimento-live-v14.js` = mesmo conteúdo de `v12` versionado).
- ✅ **Causa raiz zombie (provada via Playwright, não assumida):** módulo ES do entry `index-C9-68P_N.js` **executa 2×** (carregado com 2 URLs: `?v=...` vs sem) → **2 `createRoot` no mesmo `#root`** → app inteira monta 2× (2 forms, 2 toaster, 2 buttons). NÃO é dupla invocação React nem o monkey-patch `insertBefore` (benigno, existe em todo commit).
- ✅ **Fix aplicado:** guard de idempotência **por MONTAGEM** (não por render) no entry: `(!window.__APP_MOUNTED&&(window.__APP_MOUNTED=1))&&br(...).render(au)`.
- ✅ **Deploy nos 4 destinos oficiais** (VPS html, VPS crm, Hostinger `/ahut/`, legacy) — verificado sha `26d262d834d9`. Backups `.pre_dupfix` preservados.
- ✅ **PROD validado ao vivo:** `forms:1, emails:1, pws:1, root_children:4, body_white:false, PAGE_ERRORS:nenhum` — **login 1 form, tema claro Estate.ia mantido, sem tela branca, sem duplicata.**
- ✅ **Commit + push** `cf6c7d6` no GitHub `origin/remodel` (bundle patched + backups versionados).
- 🚨 **Reporte "Não foi possível validar a sessão"** → **✅ RESOLVIDO 03/09.** Causa raiz: cache-buster `?v=` no entry do index.html criava módulo 2× (URL ≠ chunks) → 2 contexts `Io` → Login via `$t` lia o errado → signIn stub no-op → nenhum fetch → `getUser()` null → "Não foi possível validar a sessão". Fix: remover `?v=` do entry no index.html + bundle singleton client `__AHUT_SB_Q`. Deploy 4 destinos + index.html corrigido (backups `.pre_noqv`). Commit `7f6db20` pushado. **Prova PROD real:** 1 req entry, POST `/auth/v1/token` ocorre, "Invalid login credentials" real, 0 GoTrueClient warn, `sessao_invalida:false`, `forms:1`.
- 🔄 **Próximo (ordem usuário, 2º erro):** ~~`Cannot destructure property 'error' of '(intermediate value)' as it is undefined`~~ → **✅ RESOLVIDO 03/09**. Destructuring null-safe `?.error` nos awaits de auth do `Login-CbFMVaJO.js` (submit `Promise.race` + OAuth `L()`). Prova: 0 destructuring inseguro em await (era 2). Deploy 4 destinos sha `cb940b67f25d`, commit `7ce1b3e` pushado.
- ✅ **BUG-UI-001** — Inversão Visual Grupos (isAgentSender) + Legenda lead mostrava nome do grupo: corrigido. 10 perfis atualizados no DB. Backend patched. **status: executado**
- ✅ **TCK-2026-093** — Hotfixes produção: áudio, textarea, isAgentSender (solicitado 24/08, entregue 26/08)
- ✅ **TCK-2026-092** — Correção de áudios WhatsApp: pipeline WebM→OGG, retry 2x, timeout 60s, `.single()` fix
- ✅ **Commit `38e8c1e`** — Snapshot produção + broker no `ahut-ecosystem-active`
- ✅ **Commit `3e47891`** — Schema banco de dados produção
- ✅ **MANUAL_MASTER_RUNBOOK.md** — Handover do dev original documentado
- ✅ **GUIA_COMANDANTE.md** — Comandos `/executar`, `/performance`, `/criaragente`
- ✅ **Fluxo Pós-Entrega** — SKILL.md do Jarvis atualizado com performance + lacuna + ASIMOV
- ✅ **Áudio funcionando** — Testado e validado na produção
- ✅ **Score de Performance (03/09, relatório do dia):** **85/100** — aplicado o novo critério de RETRABALHO (03/09).

### 📊 SCORECARD 03/09 — atividades do dia (novo critério de Retrabalho)
| Indicador | Avaliação do dia | Pts |
|---|---|---|
| TEMPO_EXECUCAO | Fix do ciclo puxou +1 iteração (detour do singleton no login) | 7 |
| **RETRABALHO** | **1** → correção do Comandante: validar o **fluxo REAL** (submit/login), não só render — o squad podia ter testado sozinho | **7** |
| CONFORMIDADE_CRITERIOS | 100% — zombie morto, login autentica de verdade, destructuring ok, filtro atendentes intacto | 10 |
| COBERTURA_TECNICA | index.html + entry bundle + Login + 4 destinos + runbook (5 mapeados, 5 alterados) | 10 |
| AUTONOMIA_AGENTE | Descobriu causa raiz (módulo dupla) via prova real; mas precisou de 1 correção QA de fluxo | 7 |
| APRENDIZADO_REGISTRADO | Runbook + PAINEL atualizados com a causa raiz definitiva | 10 |
| **Score final (média×10)** | | **85/100** |

> **Regra de ponderação aplicada (definida 03/09):** NÃO penalizei o usuário não ter passado acesso a sistema nunca fornecido (fora do alcance). PENALIZEI a instrução de testar o fluxo real do login — o squad tinha como descobrir sozinho (probe de submit real). Isso entrou como 1 retrabalho.

### 📊 SCORECARD 03/09 (noite) — Ciclo /executar Tasks 1–4
| Indicador | Avaliação | Pts |
|---|---|---|
| TEMPO_EXECUCAO | Dentro de ~10% do estimado (funil exigiu 1 rework do hook p/ RPCs) | 7 |
| RETRABALHO | 0 correções de escopo; 1 re-fechamento interno (hook não chamava as RPCs criadas) resolvido pelo squad | 7 |
| CONFORMIDADE_CRITERIOS | 100% — 4 tasks entregues + badge + commit seguro com push validado | 10 |
| COBERTURA_TECNICA | broker + 9 usuários + bundle v14 + TSX (App/Layout/Lang/Atendimento) + hook + SQL + 2 deploy scripts (13 mapeados, 13 alterados) | 10 |
| AUTONOMIA_AGENTE | Validou SQL no schema real, refez hook p/ RPCs, deploy dev real, commit+ls-remote — sem correção de Rodrigo | 8 |
| APRENDIZADO_REGISTRADO | Runbook (schema real DEV) + PAINEL (TASK-009) atualizados | 10 |
| **Score final (média×10)** | | **87/100** |

> **Análise de Lacuna:** PHP de funil já resolvido no DEV. Nova lacuna proposta na entrega noturna: **verificação** da Task 4 permanece DEV-bound (PROD Estate.ia usa schema diferente, sem `contracts`/`lead_id` em conversations) — vide decisão de não portar dark p/ PROD claro.

- 🔄 **Análise de Lacuna:** Agente `wab-client` proposto (WhatsApp Business Client Specialist)
- 🔄 **Engenharia reversa produção→dev:** Pendente (ADA identificou 12 correções que faltam no TSX)
- ✅ **Commit + Push no GitHub remodel** — 10 commits enviados (58c5415): cartões navegam, TreinamentoAula, 🚀 Skill ATLAS deploy dev, Gestão persistência, Neurovendas, Chamados/Tecnologia, refatoramento, RPCs Atendimento, Corretores/Agenda. [58c5415]
- ✅ **PostgreSQL 15 instalado na VPS** (2.24.95.98) — serviço systemd, DB clone_prod.
- ✅ **pg_dump da produção Supabase** (`ptochsyoyatsydfysacc`) — schema 15.113 linhas extraído com pg_dump 17.
- ✅ **Schema restaurado no clone**: 65 tabelas, 58 funções, 53 triggers, 110 RLS policies, 4 extensões.
- ✅ **Comparação clone vs dev Supabase** (`mizeybqkgvuulbatsvte`): 16 tabelas faltantes no dev foram **criadas**.
- ✅ **Divergências de colunas corrigidas**: leads.tags (removido whatsapp_group), profiles.department_id + manager_id, whatsapp_sessions.last_event_at.
- ✅ **Tabela `documents` removida** do dev (não existe em produção).
- ✅ **Dev Supabase agora com 65 tabelas** (idêntico à produção em estrutura).
- ✅ **RLS Policies incluídas** no clone (110 policies de produção).

## 🔧 INFRA — Conexão com o clone na VPS
- `postgresql://postgres:Dir@124!@$!@$@2.24.95.98:5432/clone_prod`
- Acesso completo para testes livres — 0 risco ao cliente.
- _Falta: extensions pg_cron, pg_graphql, pg_net, supabase_vault, vector (instalar se app usar)_

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
| **TASK-010** | SANEAMENTO DE LEADS LEGADOS — Funil QUBITS (MISSÃO 1) | **✅ CONCLUÍDO** | `leads.stage`: 9.313 lideranças migradas p/ `A Selecionar` (5.336 Primeiro Atendimento + 3.977 Lead Cadastrado). Backup `_backup_leads_stage_2026` (9.313). Check `leads_stage_check` ajustada (+`A Selecionar`, preservou 10 avançados). Nenhum dado avançado tocado. Commit seguro pushado. |
| **TASK-009** | Ciclo /executar 03/09 (noite) — Tasks 1-4 + commit seguro | **✅ CONCLUÍDO** | T1: broker `isFromMe` zera unread + resolve `pending→active` (rota Não Lidas); T2: 9 usuários agentes `@hut.com` criados (login HTTP 200); T3: fix inversão de balões em grupos (autoria `from_me`+`sender_id`, sem `role!=='client'`); T4: Funil Performance+SLA+Ranking (3 RPCs `get_performance_*` aplicadas+testadas no DEV, hook refeito p/ RPCs, build+deploy dev validado); T4b: badge laranja `pending` no card (sem alterar rota). Commit `70c972a` "commit seguro" pushado (ls-remote confirmado). |
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
