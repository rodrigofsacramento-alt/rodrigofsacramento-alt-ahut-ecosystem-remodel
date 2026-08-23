# 🚨 DIAGNÓSTICO — RECLAMAÇÕES DA DENISSE (Central de Atendimento)
**Data:** 23/08/2026 · **Autor:** Jarvis (com ARTEFATOS do ATLAS)
**Status:** Diagnóstico prévio concluído em frontend/protótipo. Confirmação backend requer acesso à VPS (fora deste ambiente).

## Contexto decisivo
- O build de produção **ATUAL** `Atendimento-live-v10.js` já usa `group_participants` direto (loader corrigido). Não usa mais `vw_group_participants`.
- → O frontend de produção está CORRIGIDO. A causa raiz das falhas 1 e 3 NÃO está no frontend.

## 🚨 CAUSA RAIZ DEFINITIVA (confirmada via SSH na VPS 2.24.95.98 — 23/08/2026)

**O WhatsApp da imobiliária está DESCONECTADO / LOGGED-OUT — esta é a origem de todas as 4 falhas.**

### Evidências reais dos logs do broker (`pm2 logs whatsapp-broker`)
- Broker ativo: `/root/crmahut/backend-broker` (PM2 id 0, PID 1864582, up 37h).
- O número conectado é **+595****7156** (Paraguai) — `pairingPhone:"595994857156"` confirmado no log.
- O broker está em **loop eterno de "QR code gerado"** e fechando com `closeCode 401, isLoggedOut: true` ("Connection Failure").
- Log final: **"Credenciais de autenticação removidas com sucesso no stopSession"** → a sessão Baileys foi **expulsa**.
- A pasta `auth_info/fa440b34-.../default/` está **VAZIA** (sem `creds.json`): o broker tenta `mkdir` mas a sessão não persiste/está logged-out.
- Erros `ENOENT` ao gravar `creds.json` e `lid-mapping-595994857156.json` → `transaction failed, rolling back`.

### Por que isso causa as 4 falhas da Denisse
Sem sessão WhatsApp válida, o Baileys **não recebe mensagens** em tempo real, **não sincroniza grupos/participantes** (`syncAllWhatsWhatsAppGroups` nunca popula `group_participants`), **não baixa mídia** (fica "arquivo indisponível"), e **não resolve `remote_jid`** dos contatos (não chama no privado).

### AÇÃO NECESSÁRIA (negócio, não só código)
1. **Reconectar o WhatsApp:** escanear um novo QR code (ou pareamento via código) **no celular da imobiliária**, reaproximando o número +595****7156 ao broker. Isto é manual e depende do dono do aparelho.
2. Após reconectar, o `syncAllWhatsAppGroups` (já aplicado no broker) vai popular grupos/participantes.
3. Verificar se o aparelho não foi desconectado à força (WhatsApp Web vinculado a outro, ou quem removeu a sessão).

### Estado do frontend (separado)
- O frontend de produção `Atendimento-live-v10.js` JÁ usa o loader de participantes corrigido (`group_participants` direto). Frontend OK.

### Gap local de código (Atendimento reverso) — p/ ATOM/ADA
- RPCs `accept_conversation`, `mark_conversation_read`, `transfer_conversation`, `ignore_conversation`, `update_client_contact` faltam no protótipo TSX.

---

## 🕵️ Causa-raiz hipótese (por falha) — HISTÓRICO (substituído pela seção acima)

### FALHA 1 — "não vê quem responde no grupo"
- **Frontend:** corrigido (usa group_participants).
- **Provável causa:** a tabela `group_participants` está VAZIA/depopulated no banco produtivo. Depende do broker rodar `syncAllWhatsAppGroups()` (patch_broker_groups.mjs) injetado em `ahut-whatsapp-broker/dist/session-manager.js`, disparado só na reconexão `connection === 'open'`. Se o broker não foi repatchado/reconectado, participantes nunca sincronizam.
- **Confirmar:** SSH na VPS / consultar `group_participants` count no Supabase produtivo. (fora deste sandbox)
- **Correção:** aplicar/reconfigurar `syncAllWhatsAppGroups` no broker e garantir rebuild/restart; ou rodar limpeza manual sincronizando participantes.

### FALHA 2 — "arquivo indisponível" em muitas mensagens
- **Provável causa:** mensagens de mídia (imagem/áudio/documento) gravadas sem `media_url`/`thumbnail`/`message_type` persistido pelo broker (ou URLs de storage vencidas/privadas). O frontend tenta carregar e cai em "indisponível".
- **Correção:** verificar persistência de mídia no broker (upload ao Storage Supabase e gravar media_url); garantir RLS de leitura para o bucket; renovar URL assinada quando aplicável.

### FALHA 3 — "não vê todos os contatos"
- **Provável causa:** `whatsapp_contacts`/`profiles` de clientes incompletos; mesma dependência do sync de grupos. Muitos contatos só existem como conversa mas sem perfil/contato vinculado.
- **Correção:** assegurar sync completo de contatos do Baileys → whatsapp_contacts; backfill dos perfis existentes.

### FALHA 4 — "não consegue chamar contato no privado pelo sistema"
- **Provável causa:** ausência de RPC/rota para abrir conversa privada a partir de um participante de grupo (falta mapear remote_jid individual + criar conversa 1v1). O frontend de produção chama algo como `update_client_contact`/`create_client_profile` mas o contato não está vinculado a um profile/jid.
- **Correção:** garantir existência de `remote_jid` em `whatsapp_contacts` p/ cada participante e uma ação "Chamar no privado" que cria/converte a conversa 1v1.

## 📌 GAP no protótipo TSX (local, mensurável — a cargo de ATOM/ADA)
- O `src/pages/Atendimento.tsx` reverso NÃO usa as RPCs: `accept_conversation`, `mark_conversation_read`, `transfer_conversation`, `ignore_conversation`, `update_client_contact`.
- Faltam hooks equivalentes e a UI de aceite/transferência/contador de lidas.
- Se o banco dev tem esses RPCs, implementá-los no protótipo preserva a paridade com produção.

## 🛠️ Plano de ação (backlog orquestrado)
1. **[ATLAS]** Acessar VPS + Supabase produtivo (com autorização/credenciais) p/ confirmar count de group_participants, whatsapp_contacts, e mídia vencida. [BLOQUEADO neste ambiente — requer credenciais]
2. **[ATOM/ADA]** Implementar RPCs + hooks faltantes no protótipo TSX (local, seguro).
3. **[AURA QA]** Validar tsc/build e o fluxo de aceite/transferência.
4. **[JARVIS]** Comunicar à Denisse no WhatsApp o status e o vídeo como evidência (após prioridades).