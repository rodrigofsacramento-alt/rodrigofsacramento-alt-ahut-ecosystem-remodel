# 📋 PLANO DE IMPLEMENTAÇÃO — ENGENHARIA REVERSA PRODUÇÃO → DEV

**Data:** 27/08/2026  
**Objetivo:** Equalizar o sistema DEV com o PRODUÇÃO

---

## 🎯 O QUE EXISTE EM PRODUÇÃO E NÃO TEM NO DEV (precisa implementar)

### 🔴 P1 — CRÍTICO (bloqueia funcionalidade)

| # | Item | O que tem na Produção | Onde implementar no Dev | Quem |
|---|---|---|---|---|
| 1 | **Pipeline de áudio: sendResult + upload .ogg** | Broker salva `const sendResult = await sock.sendMessage(...)`, faz upload .ogg no storage, atualiza messages table com URL .ogg | `session-manager.ts` (broker) — já foi feito, TSC sobrescreveu | ATOM |
| 2 | **`from_me` detection em grupos** | Bundle produção tem `t.from_me===!0&&!!t.sender_id&&!!P_cid&&t.sender_id!==P_cid` (5 ocorrências) | `Atendimento.tsx` — isAgentSender precisa incluir `from_me` | ADA |
| 3 | **Fallback raw buffer áudio** | `mimetype: audio/ogg; codecs=opus` quando não há URL .ogg | `Atendimento.tsx` — player com fallback buffer | ADA |
| 4 | **Timeout 60s + retry 2x áudio** | Broker tem timeout 60s e 2 retries com 3s de espera | `session-manager.ts` | ATOM |

### 🟡 P2 — MÉDIO (melhoria importante)

| # | Item | O que tem na Produção | Onde implementar | Quem |
|---|---|---|---|---|
| 5 | **CSS correto** (`index-rUI5cL83.css`) | Snapshot 2608 tem CSS funcional, dev pode ter CSS diferente | `index.html` + `assets/` | ATLAS |
| 6 | **`index.html` completo** (notranslate, anti-cache, OG tags, Node.prototype patch) | Produção: 2.555 bytes com meta tags, patch anti-remocao DOM | `index.html` do build | ATLAS |
| 7 | **Resolve session lookup via remote_jid_alt** | Broker busca `whatsapp_contacts` por `remote_jid_alt` quando LID é recebido | `session-manager.ts` — já compilado, testar | AJAX |
| 8 | **`findOrCreateParticipantProfile` valida pushName** | Não cria perfil com nome de grupo (ex: "Sistema Hut - Suporte") | `session-manager.ts` — já existe `resolveWhatsappDisplayName` | AJAX |

### 🟢 P3 — BAIXO (melhoria futura)

| # | Item | O que tem na Produção | Onde implementar | Quem |
|---|---|---|---|---|
| 9 | **Snapshot automático** antes de deploy | Manual via SFTP, precisa de script automático | VPS cron | ATLAS |
| 10 | **LIDs unificados Categoria C** | 218 leads com LID zerado → consolidar no REAL | DB (já tem função `move_profile_to_trash`) | APOLLO |

---

## 🎯 O QUE O DEV TEM QUE A PRODUÇÃO NÃO TEM (já implementado)

| Feature | Dev TSX | Status |
|---|---|---|
| ✅ RPCs: `accept_conversation`, `transfer_conversation`, `mark_conversation_read`, `ignore_conversation` | ✅ 6 RPCs | ⚠️ Precisa criar RPCs no Supabase PRODUÇÃO |
| ✅ Optimistic update (tempId + replace) | ✅ `useSendWhatsAppMessage` | ✅ Já funciona |
| ✅ Ranking modal + Dashboard corretor | ✅ | ✅ Já funciona |
| ✅ Ctrl+Space quebra linha | ✅ | ✅ Já funciona |
| ✅ Notificações com som/toast | ✅ `Notificacoes.tsx` | ⚠️ DB triggers já existem |
| ✅ 6 filtros de conversa | ✅ | ✅ Já funciona |
| ✅ Modal Add Contato estilizado | ✅ | ✅ Já funciona |

---

## 📋 PLANO DE IMPLEMENTAÇÃO (ordem sugerida)

### Sprint 1 — Equalização Crítica (P1)

| # | Tarefa | Estimativa | Dependência |
|---|---|---|---|
| 1 | Revisar `Atendimento.tsx`: adicionar `from_me` detection no isAgentSender | 1h | Nenhuma |
| 2 | Revisar `Atendimento.tsx`: adicionar fallback raw buffer para áudio sem URL | 1h | Nenhuma |
| 3 | Verificar se `session-manager.ts` (broker) tem sendResult + upload .ogg + timeout 60s | 30min | Acesso VPS |
| 4 | Compilar broker + PM2 reload | 10min | #3 |
| 5 | Copiar CSS correto (`index-rUI5cL83.css`) para o build dev | 15min | Nenhuma |

### Sprint 2 — Testes e Validação (P2)

| # | Tarefa | Estimativa | Dependência |
|---|---|---|---|
| 6 | Conectar frontend DEV no Supabase DEV (novo banco) | 30min | Credenciais do Comandante |
| 7 | Testar RPCs no Supabase DEV | 2h | #6 |
| 8 | Testar pipeline de áudio end-to-end | 2h | #6, sessão WhatsApp |
| 9 | Testar unificação LIDs Categoria B + C no DEV | 2h | #6 |
| 10 | QA completo: ranking, dashboard, notificações | 3h | #6 |

### Sprint 3 — Deploy DEV para Produção

| # | Tarefa | Estimativa | Dependência |
|---|---|---|---|
| 11 | Build Vite + deploy nos 4 destinos | 30min | Sprint 2 completo |
| 12 | Purge cache LiteSpeed | 5min | #11 |
| 13 | Validar produção funcionando | 30min | #12 |
| 14 | Commit no `ahut-ecosystem-active` | 5min | #13 |
| 15 | Commit no `ahut-ecosystem-remodel` | 5min | #14 |

---

## 📊 RESUMO

```
Produção (commit 276d652)         Dev (codigo_engenharia_reversa_tsx)
─────────────────────────         ────────────────────────────────────
✅ sendResult + upload .ogg       ❌ FALTA (P1) ← PRIMEIRO
✅ from_me detection (5x)         ❌ FALTA (P1) ← SEGUNDO
✅ fallback buffer áudio          ❌ FALTA (P1) ← TERCEIRO
✅ timeout 60s + retry 2x         ❌ FALTA (P1) ← QUARTO
✅ CSS index-rUI5cL83             ❌ FALTA (P2)
✅ index.html completo (2.5KB)    ❌ FALTA (P2)
✅ remote_jid_alt lookup          ⚠️ Compilado, testar
✅ resolveWhatsappDisplayName     ⚠️ Compilado, testar
❌ RPCs de fila                   ✅ TEM (6 RPCs) ← PRECISA CRIAR NO SUPABASE
❌ Ranking modal                  ✅ TEM
❌ Notificações com som/toast     ✅ TEM
❌ Ctrl+Space quebra linha        ✅ TEM
❌ 6 filtros de conversa          ✅ TEM
```