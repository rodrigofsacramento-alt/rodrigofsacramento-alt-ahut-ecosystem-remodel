# 📋 RELATÓRIO FINAL — ENGENHARIA REVERSA COMPLETA DO ATENDIMENTO

**Data:** 27/08/2026
**Facilitador:** ARGUS (Scrum Master)
**Escopo:** Frontend (TSX ↔ Bundles) + Backend/Broker (Baileys) + Banco (Supabase)
**Commit Produção:** `fe130cb` (26/08 21:00 UTC) — Bundle `index-C9-68P_N.js` (162KB)
**Commit Dev:** `codigo_engenharia_reversa_tsx` — Bundle `index-K4ETaGhw.js` (1.3MB)

---

## SUMÁRIO EXECUTIVO

O sistema de produção está rodando um **bundle antigo (chunk system)** com funcionalidades limitadas. O dev tem um bundle Vite moderno **8x maior** com features novas (RPCs de fila, textarea, ranking). **Mas o dev AINDA FALTA** várias features que existem apenas no bundle de produção. Os principais GAPs:

| # | GAP | Complexidade | Quem | Status |
|---|-----|:-----------:|:----:|:------:|
| 1 | Sessão WhatsApp offline (reboot quebrou creds) | 🔴 P1 | AJAX + ATOM | ⏳ Pendente |
| 2 | `findOrCreateParticipantProfile` compilado mas sessão offline | 🔴 P1 | AJAX + ATOM | ⏳ Pendente |
| 3 | Bundle produção (162KB) vs dev (1.3MB) — incompatível | 🔴 P1 | ATLAS | ⏳ Pendente |
| 4 | `index-CId5T3Nd.css` sumiu (snapshot 2608 tinha outro) | 🔴 P1 | ATLAS | ⏳ Pendente |
| 5 | RPCs `accept_conversation`, `transfer_conversation`, `ignore_conversation`, `mark_conversation_read` só no dev | 🟡 P2 | ATOM | ⏳ Pendente |
| 6 | isAgentSender fixado no bundle produção mas TSX precisa revisão | 🟡 P2 | ADA + ATOM | ⚠️ Parcial |
| 7 | Pipeline de áudio (WebM→OGG) só no broker — TSX sem player completo | 🟡 P2 | AJAX + ATOM | ⚠️ Parcial |
| 8 | Grupos: `remote_jid_alt`, `vw_group_participants`, legenda nome+telefone | 🟡 P2 | AJAX + ATOM | ⚠️ Parcial |
| 9 | Notificações DB triggers existem mas frontend pode estar desalinhado | 🟢 P3 | APOLLO + ATOM | ⚠️ Parcial |
| 10 | QA: 404 em assets, funcionalidades não testadas | 🟡 P2 | AURA | ⏳ Pendente |
| 11 | Segurança: anon key exposta, service_role no bundle, RLS a verificar | 🔴 P1 | AEGIS | ⏳ Pendente |
| 12 | LIDs duplicados: 218 perfis pra unificar (Categoria C) | 🟢 P3 | APOLLO | ⏳ Pendente |

---

## SEÇÃO 1 — DIAGNÓSTICO: PRODUÇÃO vs DEV

### 1. JARVIS — Visão Geral do Fluxo

**O que está rodando:**
- **Produção:** Hostinger (SFTP) — SPA React com chunk system. Bundle `index-C9-68P_N.js` (162KB).
- **Dev:** Vite build (1.3MB) com code-split moderno. Porta 5173.
- **Broker:** VPS `2.24.95.98` — WhatsApp Baileys rodando em Node.js.
- **Banco:** Supabase produção `ptochsyoyatsydfysacc` (65 tabelas, 58 funções, 53 triggers, 110 RLS policies).
- **Dev Supabase:** `ldfcqxeehgaftxsgxkag.supabase.co` (clone com 65 tabelas — idêntico).

**O que falta:**
- Sessão WhatsApp desconectada (reboot VPS quebrou credenciais). Precisa re-parear.
- Bundle produção é muito antigo — features novas do dev (RPCs, textarea, ranking) não estão em produção.
- `index-CId5T3Nd.css` sumiu — HTML referencia CSS que não existe.

**Fluxo atual:**
```
WhatsApp → Broker (Baileys VPS) → Supabase DB → Frontend (Hostinger SPA)
```

---

### 2. ATOM — Código Fonte TSX vs Bundle Produção

#### Patch de Áudio
| Aspecto | Produção | Dev (TSX) |
|---------|----------|-----------|
| Player `<audio>` | ✅ Suporta ogg/webm/mpeg/mp4 | ✅ Implementado no Atendimento.tsx (linhas 930-937) |
| Pipeline WebM→OGG | ✅ Broker converte via FFmpeg | ⚠️ Só broker, frontend só toca |
| Fallback raw buffer | ✅ `mimetype: audio/ogg; codecs=opus` | ❌ Não implementado no TSX |
| Timeout 60s + retry 2x | ✅ No broker | ❌ Só no broker |

#### sendMessage / sendResult
| Aspecto | Produção | Dev (TSX) |
|---------|----------|-----------|
| `sendWhatsAppMessage` RPC | ✅ No broker | ✅ `useSendWhatsAppMessage` no useWhatsapp.ts |
| Optimistic update | ❌ Não faz | ✅ Implementado (tempId + replace) |
| `mutateAsync` retorno | ❌ Usa callback antigo | ✅ `react-query` moderno |
| `from_me` detection | ❌ Não existe no bundle (0 occurrências) | ✅ 1 occurrência no dev, 5 no Atendimento bundle |

#### isAgentSender
| Aspecto | Produção | Dev (TSX) |
|---------|----------|-----------|
| Lógica original | ❌ Bug: mostrava qualquer `role !== client` como agente | ⚠️ Foi corrigida (linhas 861-865) |
| Patch aplicado | ✅ Só `sender_id === user.id` é lado direito (26/08) | ⚠️ Replicado no TSX |
| Grupo: legenda | ✅ Nome + telefone do participante | ✅ Implementado (linhas 875-877) |
| Grupo: header agente | ✅ Nome + departamento | ✅ Implementado (linhas 870-872) |

#### Textarea
| Aspecto | Produção | Dev (TSX) |
|---------|----------|-----------|
| Tipo | ✅ `<textarea>` (após hotfix) | ✅ `textarea` com auto-resize |
| Enter envia | ✅ | ✅ |
| Ctrl+Enter quebra linha | ✅ | ✅ |
| Ctrl+Space quebra linha | ❌ | ✅ (feature extra no dev) |
| Auto-resize vertical | ✅ | ✅ (max-h-[200px]) |

#### Player de Mídia
| Aspecto | Produção | Dev (TSX) |
|---------|----------|-----------|
| Áudio (ogg/webm/mpeg/mp4) | ✅ | ✅ |
| Imagem (click p/ abrir) | ✅ | ✅ |
| Vídeo | ✅ | ✅ |
| Documento (link) | ✅ | ✅ |
| Mensagem sistema | ✅ | ✅ |
| `[Audio]` prefix parsing | ✅ | ✅ (linhas 880-892) |

#### RPCs da Fila (GAP CRÍTICO)
| RPC | Produção | Dev (TSX) | Onde usar |
|-----|:--------:|:---------:|-----------|
| `accept_conversation` | ❌ | ✅ | Botão Aceitar no header |
| `transfer_conversation` | ❌ | ✅ | Select Transferir |
| `mark_conversation_read` | ❌ | ✅ | Ao selecionar conversa |
| `ignore_conversation` | ❌ | ✅ | Botão Ignorar |
| `create_client_profile` | ❌ | ✅ | Modal Add Contato |
| `update_client_contact` | ❌ | ✅ | Chamar no privado |

> **⚠️ Conclusão:** Produção **NÃO TEM** nenhuma dessas RPCs. Elas só existem no dev. Isso significa que a fila de atendimento (aceitar/transferir) não funciona em produção. É uma feature NOVA que precisa ser testada antes de subir.

---

### 3. ADA — Layout/Login/Notificações

#### UI/UX
| Aspecto | Produção | Dev |
|---------|----------|-----|
| Paleta de cores | Tema claro padrão | Tema claro + badges laranja |
| Sidebar conversas | Lista simples | Filtros por tabs + período + corretor |
| Chat header | Básico | Aceitar/Transferir/Ignorar + IA toggle + Notas |
| Ranking modal | ❌ | ✅ (linhas 1185-1219) |
| Dashboard corretor | ❌ | ✅ (linhas 583-609) |
| Modal Add Contato | ❌ (básico) | ✅ Estilizado dark |

#### Login
| Aspecto | Produção | Dev |
|---------|----------|-----|
| Tela de login | Padrão | `Login.tsx` com autenticação Supabase |
| RBAC | Admin/Agent/Manager | Admin/Agent/Manager + email sacramento |

#### Notificações
| Aspecto | Produção | Dev |
|---------|----------|-----|
| Tabela `notifications` | ✅ DB triggers (new_lead, sale_completed) | ✅ |
| Painel notificações | ✅ | `Notificacoes.tsx` |
| Sons/toast | ❌ | ✅ |

#### Tecnologia
| Aspecto | Produção | Dev |
|---------|----------|-----|
| Build system | **Chunk system (legado)** | Vite 6 |
| Bundle size | 162KB (antigo) | 1.3MB (moderno) |
| `lucide-react` icons | ❌ (SVG inline) | ✅ 44+ ícones |
| Tailwind CSS | ✅ | ✅ |

---

### 4. ATLAS — Deploy Pipeline, Nginx, 4 Destinos

#### Deploy Pipeline
| Aspecto | Status |
|---------|--------|
| Hostinger SFTP (produção principal) | ✅ Rodando |
| VPS `2.24.95.98` (broker) | ✅ Rodando (PM2) |
| `dev-ahut-ecosystem.apexfyhub.com.br` | ✅ Rodando |
| `ahut-ecosystem.apexfyhub.com.br` (produção) | ✅ Rodando |
| Snapshot automático | ❌ Manual |

#### 4 Destinos de Deploy
| Destino | URL | Docroot | Status |
|---------|-----|---------|:------:|
| Produção | `ahut-ecosystem.apexfyhub.com.br` | `/` | ✅ |
| Dev | `dev-ahut-ecosystem.apexfyhub.com.br` | `dist/` | ✅ |
| Broker | `2.24.95.98:3000` | `/root/crmahut/backend-broker` | ✅ |
| Banco clone | `2.24.95.98:5432/clone_prod` | PG | ✅ |

#### Problemas Identificados
1. **Bundle produção 162KB** — muito menor que dev 1.3MB. Chunk system diferente.
2. **`index-CId5T3Nd.css`** referenciado no HTML mas **não existe** (snapshot 2608 tinha `index-rUI5cL83.css`)
3. **Sem rollback automático** — snapshot manual via SFTP.
4. **Sem CI/CD** — deploy manual.

---

### 5. AURA — QA / O Que Está Quebrado

#### Problemas Conhecidos
| # | Problema | Severidade | Local |
|---|----------|:----------:|-------|
| 1 | Sessão WhatsApp offline (reboot quebrou creds) | 🔴 CRÍTICO | Broker VPS |
| 2 | 404 CSS: `index-CId5T3Nd.css` não encontrado | 🔴 ALTA | Produção |
| 3 | `findOrCreateParticipantProfile` não roda (sessão offline) | 🔴 ALTA | Broker |
| 4 | Bundle produção sem RPCs de fila | 🟡 MÉDIA | Produção |
| 5 | Notificações podem estar sem som/toast | 🟢 BAIXA | Produção |
| 6 | 218 LIDs duplicados (Categoria C) | 🟢 BAIXA | DB |
| 7 | 12 LIDs duplicados (Categoria A — ambos com msgs) | 🟡 MÉDIA | DB |

#### Funcionalidades Não Testadas
- `accept_conversation` RPC (só no dev)
- `transfer_conversation` RPC (só no dev)
- `mark_conversation_read` RPC (só no dev)
- `ignore_conversation` RPC (só no dev)
- Ranking modal (só no dev)
- Dashboard corretor (só no dev)

---

### 6. AEGIS — Segurança

#### Problemas Identificados
| # | Risco | Severidade | Detalhe |
|---|-------|:----------:|---------|
| 1 | **Anon key exposta** no bundle JS | 🔴 CRÍTICO | `ptochsyoyatsydfysacc.supabase.co` hardcoded no bundle produção |
| 2 | **service_role** no broker? | 🔴 CRÍTICO | Verificar se broker usa service_role (dá bypass RLS) |
| 3 | Senhas resetadas via GoTrue Admin API (26/08) | 🟢 OK | 10 usuários, senhas funcionam |
| 4 | RLS policies: 110 policies no clone | 🟡 Verificar | Precisa validar se todas funcionam no TSX |
| 5 | Bundle dev sem anon key hardcoded? | 🟡 MÉDIO | `useSupabase` pode ter key inline |

#### Recomendações
1. **Mover anon key para envio server-side** ou ao menos restringir permissões da anon key no Supabase.
2. **Verificar se broker usa service_role** — se sim, restringir a operações específicas.
3. **Validar RLS nas tabelas `conversations`, `messages`, `profiles`** — garantir que agentes só veem suas conversas.

---

### 7. ARGUS — Processo Deploy / Riscos / Dependências (VOCÊ)

#### Processo Atual
1. Desenvolvimento no TSX local → build Vite → upload SFTP Hostinger
2. Broker atualizado via SSH na VPS + PM2 reload
3. DB schema via pg_dump/pg_restore

#### Riscos
| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|:-------------:|:-------:|-----------|
| 1 | Build dev (1.3MB) não funciona com chunk system produção | ALTA | ALTO | Testar build dev em subdomínio antes de subir |
| 2 | Sessão WhatsApp offline sem data de recuperação | ALTA | CRÍTICO | Re-parear manual ou aguardar QR |
| 3 | CSS 404 quebra layout produção | MÉDIA | ALTO | Corrigir referência ou servir CSS |
| 4 | RPCs novas quebram sem funções SQL no Supabase | MÉDIA | ALTO | Verificar se RPCs existem no Supabase produção |
| 5 | Dependência de dev original para broker | ALTA | MÉDIO | Documentar no MANUAL_MASTER_RUNBOOK |

#### Dependências
| # | Dependência | Bloqueia | Responsável |
|---|------------|:--------:|-------------|
| 1 | Sessão WhatsApp re-pareada | Teste de mensagens | AJAX + ATOM |
| 2 | RPCs SQL no Supabase produção | Aceitar/Transferir | ATLAS |
| 3 | CSS correto servido | UI produção | ATLAS |
| 4 | Chunk system compatível | Deploy dev→prod | ATLAS + ATOM |

---

### 8. AVA — O Que o Usuário Final Reporta vs Implementado

#### Reclamações da Denisse (Central de Atendimento)
| # | Relato da Denisse | Status no Dev | Status na Produção |
|---|-------------------|:-------------:|:------------------:|
| 1 | "Não vê quem responde no grupo" | ✅ Legenda nome+telefone + header agente | ✅ Patch isAgentSender (26/08) |
| 2 | "Mensagens como arquivo indisponível" | ✅ Player mídia multi-formato | ✅ Pipeline áudio (26/08) |
| 3 | "Não vê todos os contatos" | ⚠️ Depende de sessão WhatsApp | ⚠️ Sessão offline |
| 4 | "Não consegue chamar contato no privado" | ⚠️ `update_client_contact` RPC só no dev | ❌ Não implementado |

---

### 9. APOLLO — Dados / Triggers / Funções do Banco

#### Triggers de Notificação
| Trigger | Tabela | Evento | Status |
|---------|--------|:------:|:------:|
| `new_lead` | `leads` | INSERT | ✅ Ativo |
| `sale_completed` | `deals` | UPDATE status='closed_won' | ✅ Ativo |
| `new_message` | `messages` | INSERT | ✅ Ativo (verificar) |

#### Funções do Banco (RPCs)
| Função | Status no Supabase | Status no TSX |
|--------|:------------------:|:-------------:|
| `accept_conversation` | ⚠️ Verificar | ✅ useAcceptConversation |
| `transfer_conversation` | ⚠️ Verificar | ✅ useTransferConversation |
| `mark_conversation_read` | ⚠️ Verificar | ✅ useMarkConversationRead |
| `ignore_conversation` | ⚠️ Verificar | ✅ useIgnoreConversation |
| `create_client_profile` | ✅ Confirmada | ✅ handleAddContact |
| `update_client_contact` | ⚠️ Verificar | ✅ useUpdateClientContact |

> **⚠️ ATENÇÃO:** Se as RPCs não existirem no Supabase produção, chamar esses hooks do dev vai gerar erro HTTP 404/400. ATLAS precisa verificar antes do deploy.

---

### 10. ARIA — Status da Sessão WhatsApp

#### Status Atual
| Indicador | Valor |
|-----------|-------|
| Sessão ativa? | ❌ **Desconectada** (reboot VPS quebrou creds) |
| Último pareamento | Antes de 26/08 |
| Broker rodando? | ✅ PM2 online |
| Mensagens fluindo? | ❌ Parado |
| LIDs sendo processados? | ❌ Parado |
| `remote_jid_alt` funcionando? | ⚠️ Depende de sessão |

#### Ação Necessária
1. Re-iniciar sessão WhatsApp no broker
2. Escanear QR Code no frontend (admin only)
3. Verificar se `findOrCreateParticipantProfile` compilado e funcionando

---

### 11. AJAX — Pipeline WhatsApp

#### Pipeline de Áudio
```
WhatsApp (WebM) → Broker download → FFmpeg WebM→OGG → Supabase Storage → DB messages → Frontend player
```

#### Status das Funções
| Função | Status | Observação |
|--------|:------:|------------|
| `sendMessage` | ✅ | Broker envia via Baileys |
| `sendAudio` | ✅ | WebM→OGG + re-upload |
| `findOrCreateParticipantProfile` | ⚠️ Compilado mas sessão offline | Precisa testar |
| `remote_jid_alt` | ✅ Implementado | Fallback lookup |
| `resolveWhatsappDisplayName` | ✅ | Group fix |
| `updateParticipantProfile` | ⚠️ Compilado | Depende de sessão |

---

## SEÇÃO 2 — PLANO DE ENGENHARIA REVERSA (por prioridade)

### 🔴 PRIORIDADE 1 — Urgente (bloqueia tudo)

| # | Item | O Quê | Onde | Quem | Estimativa |
|---|------|-------|------|:----:|:----------:|
| P1.1 | **Re-parear sessão WhatsApp** | Reconectar Baileys na VPS, escanear QR | Broker: `/root/crmahut/backend-broker` | AJAX + ATOM | 1-2h |
| P1.2 | **Corrigir CSS 404** | Servir `index-CId5T3Nd.css` ou alterar HTML | Hostinger SFTP | ATLAS | 30min |
| P1.3 | **Verificar RPCs no Supabase produção** | Confirmar se `accept_conversation`, `transfer_conversation`, etc existem | Supabase SQL Editor | ATLAS | 1h |
| P1.4 | **Auditoria segurança** | Verificar anon key, service_role, RLS policies | Bundle + Supabase + Broker | AEGIS | 2h |
| P1.5 | **Snapshots automáticos** | Criar script de snapshot antes de qualquer deploy | VPS | ATLAS | 1h |

### 🟡 PRIORIDADE 2 — Médio (funcionalidades importantes)

| # | Item | O Quê | Onde | Quem | Estimativa |
|---|------|-------|------|:----:|:----------:|
| P2.1 | **Testar RPCs dev no ambiente dev** | Validar `accept_conversation`, `transfer_conversation`, `ignore_conversation`, `mark_conversation_read` | Dev Supabase + dev-ahut | ATOM | 2h |
| P2.2 | **Comparação completa bundle vs TSX** | Extrair TODAS as funções do bundle produção que faltam no TSX | `index-C9-68P_N.js` + `Atendimento-DcqAjCvf.js` | ATOM + ADA | 4h |
| P2.3 | **Resolver 12 LIDs Categoria A** | Unificação manual (LID+REAL ambos com msgs) | DB Supabase | APOLLO | 3h |
| P2.4 | **Testar funcionalidades dev completas** | QA de todas as RPCs, ranking, dashboard, notificações | dev-ahut.apexfyhub.com.br | AURA | 3h |
| P2.5 | **Validar pipeline de áudio end-to-end** | Enviar áudio → broker → storage → frontend | Broker + Frontend | AJAX + ATOM | 2h |
| P2.6 | **Resolver grupos: legenda nome+telefone** | Verificar se `vw_group_participants` populada | Broker + DB | AJAX | 1h |

### 🟢 PRIORIDADE 3 — Baixo (melhorias)

| # | Item | O Quê | Onde | Quem | Estimativa |
|---|------|-------|------|:----:|:----------:|
| P3.1 | **Unificar 218 LIDs Categoria C** | Automático via `move_profile_to_trash()` | DB Supabase | APOLLO | 1h |
| P3.2 | **Implementar CI/CD básico** | Script de deploy automático + rollback | VPS | ATLAS | 4h |
| P3.3 | **Adicionar notificações com som/toast** | Se não existir em produção | Frontend | ADA | 2h |
| P3.4 | **Implementar ranking modal no dev (já feito)** | Confirmar funcionando | dev-ahut | ATOM | 30min |
| P3.5 | **Corrigir mensagens "arquivo indisponível"** | Debug no broker de mídias sem media_url | Broker | AJAX | 2h |

---

## SEÇÃO 3 — DECISÕES DA REUNIÃO

### Pendências para o Comandante Rodrigo Sacramento
1. ✅ **Autorizar re-pareamento da sessão WhatsApp** (precisa QR code escaneado)
2. ✅ **Definir data para deploy do build dev na produção** (após todos P1 resolvidos)
3. ✅ **Definir prioridade para unificação de LIDs** (230 leads duplicados)
4. ✅ **Aprovar criação de CI/CD** (reduz risco de deploy manual)

### Próximos Passos Imediatos
1. **ATLAS** verificar RPCs no Supabase produção (P1.3)
2. **AJAX + ATOM** re-parear sessão WhatsApp (P1.1)
3. **ATLAS** corrigir CSS 404 (P1.2)
4. **AEGIS** auditoria de segurança (P1.4)
5. **APOLLO** começar unificação Categoria C (P3.1)

---

## SEÇÃO 4 — ANEXOS TÉCNICOS

### Bundle Analysis Summary
| Bundle | Tamanho | Build System | RPCs | Player Mídia | Tabs Filtro |
|--------|:-------:|:-----------:|:----:|:------------:|:-----------:|
| `index-C9-68P_N.js` (prod) | 162KB | Chunk system | ❌ | ⚠️ Básico | ❌ |
| `index-K4ETaGhw.js` (dev) | 1.3MB | Vite 6 | ✅ 8x | ✅ Completo | ✅ 6 tabs |
| `Atendimento-DcqAjCvf.js` (prod) | 162KB | Chunk system | ⚠️ Parcial | ✅ | ✅ |

### Dados do Broker
```
Host: 2.24.95.98
Path: /root/crmahut/backend-broker/src/session-manager.ts
Orquestrador: PM2
Status: Online (WhatsApp sessão offline)
```

### Dados do Banco
```
Produção: ptochsyoyatsydfysacc.supabase.co
Dev: ldfcqxeehgaftxsgxkag.supabase.co  
Clone VPS: 2.24.95.98:5432/clone_prod
Tabelas: 65
Funções: 58
Triggers: 53
RLS Policies: 110
```

---

*Documento gerado por ARGUS (Scrum Master) em 27/08/2026 — Reunião Geral do Squad Tech Ahut*
*Próxima revisão: Após resolução dos itens P1*