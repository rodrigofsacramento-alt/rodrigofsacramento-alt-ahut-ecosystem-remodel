# 📣 COMUNICADO À EQUIPE — Recomendação da Squad Tech (Atualização)

**Status:** RASCUNHO PRONTO para envio à Denisse + demais usuários admin.
**Origem:** Jarvis (Squad Tech Ahut) após investigação (Ciclo 1/2 — 23/08/2026).
**Motivo:** alinhar toda a equipe para não terem o mesmo problema relatado pela Denisse.

---

## Mensagem (para TODOS os usuários admin/atendentes)

Olá, equipe! 👋

Aqui é o **Jarvis, da Squad Tech da Ahut**. Detectamos que o **WhatsApp oficial da imobiliária (número +595****7156) está desconectado** do nosso sistema. Isso afeta a Central de Atendimento de **todos**:

- ❌ Não vemos **quem responde** nos grupos
- ❌ Muitas mensagens aparecem como **"arquivo indisponível"**
- ❌ Não vemos **todos os contatos**
- ❌ Não conseguimos **chamar no privado** pelo sistema

> ⚠️ **Importante:** estes sintomas NÃO são erro da conta de vocês. São o **efeito do WhatsApp desconectado** do sistema. Por isso, queremos alinhar **todos** para seguir o mesmo procedimento e evitar retrabalho.

### ✅ O que Fazer (somente quando o WhatsApp for reconectado)
1. **Reconectar o WhatsApp:** na Central de Atendimento → botão **Conexão WhatsApp** → escanear o **QR Code (ou código de pareamento)** gerado, **no aparelho da imobiliária** (a linha +595****7156).
2. Após o escaneamento, o sistema **sincroniza automaticamente** grupos, participantes e contatos.
3. Em alguns minutos, todos os itens acima voltam a funcionar normalmente.

### 🛡️ Proteção (evita derrubar o sistema)
- **NUNCA** clique em "Desconectar Sessão" sem necessidade — isso exigirá o re-escaneamento do QR no aparelho.
- Se o WhatsApp do sistema "deslogar" sozinho, **não tente contornar** mexendo no servidor — **abra um chamado no módulo Tecnologia** e aguarde a Squad Tech reconectar com segurança.
- Após qualquer problema, **aguarde o status "Conectado"** na Central antes de usar o atendimento em larga escala.

### 📞 Se você ainda estiver vendo o problema
- Confirme na tela de Conexão se o status é **"Conectado"**. Se estiver "QR Code gerado" ou "Desconectado", é porque a sessão precisa ser re-escanada no aparelho.
- A Identificação de remetente, mídias e contatos só carregam com o WhatsApp **conectado**.

---

## Notas técnicas internas (squad — NÃO enviar)
- VPS: `2.24.95.98` → broker `/root/crmahut/backend-broker` (PM2 id 0).
- Causa raiz: `closeCode 401, isLoggedOut:true` → sessão expulsa; logs mostram loop de "QR code gerado"; número conectado = `+595****7156` (Paraguai, confirmed via `pairingPhone:"595994857156"`).
- Frontend de produção `Atendimento-live-v10.js` JÁ usa o loader de participantes corrigido (`group_participants`). Frontend OK.
- `syncAllWhatsAppGroups` JÁ está aplicado no broker → grupos/participantes/contatos auto-populam ao reconectar.
- Ação necessária: reconectar via QR no aparelho. É ação de negócio (manual).
- Endpoint de envio de mensagem: tabela `whatsapp_messages` (INSERT status=pending) → broker envia via Baileys. (Somente após reconexão entrega.)

## 🎯 Comunicação a fazer (lista de destinatários)
1. **Denisse** (reportou os sintomas com vídeo) — responder diretamente.
2. **Admins/atendentes** — comunicado amplo de alinhamento (este documento).
3. Após reconexão: confirmar na Central que grupos/participantes/contatos carregam.