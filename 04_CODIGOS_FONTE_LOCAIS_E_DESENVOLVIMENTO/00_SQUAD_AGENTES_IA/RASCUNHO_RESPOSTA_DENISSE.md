# 📱 RASCUNHO — RESPOSTA À DENISSE (Central de Atendimento)

**Status:** RASCUNHO PRONTO. Envio pendente de (1) reconexão do WhatsApp +595 e (2) autorização do comandante / canal correto (regra: fora do grupo de teste requer aval).
**Evidência em vídeo:** `video_6218edc59d44.mp4` (gravação de tela, 30.9s, da falha na Central).

---

## Mensagem para a Denisse (pontes com o diagnóstico real)

Olá, Denisse! 👋 Aqui é o **Jarvis, da Squad Tech da Ahut**. Recebemos seu vídeo e o seu relato sobre a Central de Atendimento. Já investigamos a fundo e identificamos a **causa de tudo** o que você descreveu (não ver quem responde no grupo, arquivo indisponível, não ver contatos e não chamar no privado).

**O que está acontecendo:** o WhatsApp oficial da imobiliária (número **+595****7156**) foi **desconectado** do nosso sistema. Sem ele conectado, o painel fica "vazio": não carrega os remetentes dos grupos, não baixa as mídias (daí o "arquivo indisponível") e não mostra todos os contatos / não permite abrir conversa no privado. **Tudo isso é efeito do WhatsApp desconectado**, não da sua conta.

**O que precisa ser feito (rápido e simples):**
1. Vamos gerar um **QR Code** (ou código de pareamento) na tela de Conexão do WhatsApp, dentro do sistema.
2. Esse QR deve ser escaneado **no aparelho da imobiliária** (o celular que usa o +595****7156).
3. Após escanear, o sistema sincroniza os grupos, participantes e contatos automaticamente — e os erros somem.

**Alerta:** se o aparelho foi desconectado à força (alguém removeu o "WhatsApp Web" para este sistema, ou vinculou outro), precisaremos re-escaniar. Nos ajude confirmando que o celular da imobiliária está disponível para o scan.

Assim que o WhatsApp voltar a conectar, todo o painel volta a funcionar. Estamos aqui para acompanhar! 🙏

---

## Notas técnicas internas (para o squad) — NÃO incluir na mensagem
- Broker: `/root/crmahut/backend-broker` (VPS 2.24.95.98)
- Logs confirmam: `closeCode 401, isLoggedOut:true` → sessão expulsa; loop de "QR code gerado"
- `pairingPhone":"595994857156"` = número conectado (confirmado)
- `syncAllWhatsAppGroups` JÁ aplicado no broker → grupos/participantes auto-populam ao reconectar
- Frontend de produção `Atendimento-live-v10.js` já usa loader de participantes corrigido → frontend OK
- Após reconectar, monitorar se `group_participants` e `whatsapp_contacts` populam; validar mídia baixando