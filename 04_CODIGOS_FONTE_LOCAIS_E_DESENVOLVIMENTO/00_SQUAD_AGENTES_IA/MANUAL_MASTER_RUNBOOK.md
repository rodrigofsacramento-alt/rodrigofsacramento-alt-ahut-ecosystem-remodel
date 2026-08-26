# 📘 MANUAL MESTRE DE ARQUITETURA, BACKEND & OPERAÇÕES (RUNBOOK)
> Projeto: CRM Imobiliário Estate.ia / Ahut Ecosystem
> Finalidade: Documento de Transição Técnica (Handover) e Guia Operacional Definitivo para Engenharia de Backend, DevOps e Integração WhatsApp.
> Status da Arquitetura: Produção Ativa e Validada
> Última Atualização: Agosto/2026

> **FONTE ORIGINAL:** Documento entregue pelo desenvolvedor original do sistema em 26/08/2026 após incidente de áudio. Contém a verdade arquitetural 100% validada.
> **FONTE DO CONHECIMENTO:** VPS 2.24.95.98 (Debian 10), broker `/root/crmahut/backend-broker/`.

---

## 🎯 Sumário Executivo
Este documento consolida toda a inteligência de engenharia, infraestrutura, modelagem de banco de dados, regras de negócio e operações do backend do CRM. O objetivo é permitir que qualquer desenvolvedor pleno/sênior opere, realize manutenção, debuge e faça novos deploys de forma 100% autônoma.

---

## 🧭 Índice do Documento
1. Topologia de Infraestrutura & Acessos
2. Arquitetura dos Microsserviços & Processos PM2
3. Modelo de Dados (Supabase PostgreSQL) & Realtime
4. Engenharia Detalhada do Broker WhatsApp (Baileys)
5. 🌟 SEÇÃO ESPECIAL: Pipeline de Áudio, Codecs & Transcodificação FFmpeg
6. Sincronização de Grupos, Participantes & Contatos
7. Ciclo de Deploy, Compilação TypeScript & Zero-Downtime
8. Playbook de Resolução de Incidentes (Troubleshooting)
9. Variáveis de Ambiente (.env) & Dependências Críticas
10. 🚫 As 10 Linhas Vermelhas da Arquitetura (O que NUNCA fazer)

---

## 1. Topologia de Infraestrutura & Acessos

| Componente | Hospedagem / Provedor | Endereço / Host | Porta | Credenciais / Localização |
| :--- | :--- | :--- | :---: | :--- |
| Backend VPS | Servidor Linux (Debian 10) | 2.24.95.98 | 22 (SSH) | Usuário: root \| Senha: Dir@5207411605 |
| Diretório do Broker | VPS Local Path | /root/crmahut/backend-broker/ | 3001 (Interna) | Código compilado em dist/, fonte em src/ |
| Banco de Dados | Supabase Cloud | ptochsyoyatsydfysacc.supabase.co | 443 (HTTPS) | Project ID: ptochsyoyatsydfysacc |
| Frontend Web | Hostinger LiteSpeed | 82.25.73.206 | 65002 (SFTP) | Usuário: u817195350 \| Senha: Dir@5207411605 |
| Docroot Ativo Web | Hostinger Path | domains/apexfyhub.com.br/public_html/ahut/ | 443 | URL: https://ahut-ecosystem.apexfyhub.com.br |

---

## 2. Arquitetura dos Microsserviços & Processos PM2

Serviços orquestrados pelo PM2 na VPS:
- id 0 `whatsapp-broker` — Baileys WhatsApp broker (pasta /root/crmahut/backend-broker/)
- id 8 `analise-backend`
- id 9 `indavent-whatsapp-broker`

### Comandos Essenciais do PM2:
- `pm2 status` — status geral
- `pm2 logs whatsapp-broker --lines 50` — logs em tempo real
- `pm2 reload whatsapp-broker` — recarregar sem derrubar conexões (zero-downtime)
- `pm2 restart 0` — hard restart
- `pm2 monit` — monitorar CPU e memória

---

## 3. Modelo de Dados (Supabase PostgreSQL) & Realtime

### A. Tabela public.messages (Exibição do Chat no CRM)
**EXATAMENTE 8 colunas nativas** (nunca adicionar media_url sem alterar mappers do frontend):
1. id (UUID - PK)
2. conversation_id (UUID - FK conversations.id)
3. sender_id (UUID)
4. receiver_id (UUID ou nulo)
5. content (TEXT - conteúdo textual ou payload de mídia)
6. message_type (TEXT - text, image, audio, video, document, system)
7. is_read (BOOLEAN)
8. created_at (TIMESTAMPTZ)

#### 📝 Padrão de Armazenamento de Mídias no content (2 linhas):
- `[Audio] nome.ogg\nhttps://...`
- `[Imagem] nome.jpg\nhttps://...`
- `[Video] nome.mp4\nhttps://...`
- `[Arquivo] nome.pdf\nhttps://...`

### B. Tabela public.whatsapp_messages (Fila do Baileys)
Rastreabilidade bruta do WhatsApp (remote_jid, whatsapp_message_id, from_me, status).

### C. Tabela public.whatsapp_sessions (Controle de Conexão)
status: disconnected, connecting, qr_ready, connected, error. Contém qr_code, pairing_code, phone_number.

---

## 4. Engenharia Detalhada do Broker WhatsApp (Baileys)

- Node.js com @whiskeysockets/baileys 7.x
- Fluxo: escuta Realtime Supabase → gera QR/pairing em whatsapp_sessions → credenciais em auth_info/{TENANT}/default/creds.json → envia outbound via sendMessageToWhatsApp()

---

## 5. 🌟 SEÇÃO ESPECIAL: Pipeline de Áudio, Codecs & Transcodificação FFmpeg

> ⚠️ ATENÇÃO MÁXIMA: Esta é a seção mais crítica da integração.

### Ecossistemas que tratam áudio de forma diferente:
1. Desktop (Chrome/Edge/Brave): gravam `audio/webm; codecs=opus`
2. Apple (Safari/iOS): não reproduzem WebM confiável, exigem MP4 (AAC) ou Ogg Opus
3. WhatsApp (iOS/Android): para PTT exige estritamente **contêiner Ogg Opus** (`audio/ogg; codecs=opus`) com cabeçalho binário OggS

Se enviar URL .webm declarando mimetype audio/mp4, o celular do cliente exibe "Não foi possível baixar o áudio".

### 🛠️ Pipeline Definitivo de Áudio (Dual Flow)
```
[Corretor grava no CRM] → envia .webm para chat-attachments
    ▼
[Broker intercepta URL]
    ├── 1. Download .webm para buffer
    ├── 2. FFmpeg transcodifica para Ogg Opus (32k VBR, Mono)
    ├── 3. Gera waveform
    ▼                     ▼
[FLUXO WHATSAPP CLIENTE]        [FLUXO PLAYER CRM WEB]
sendMessage(jid, {              upload(.ogg) ao storage,
  audio: oggBuffer,             update messages content:
  mimetype:'audio/ogg;codecs=opus',  "[Audio] nome.ogg\nURL"
  ptt: true, waveform:...       player web toca .ogg
})
```

### 💻 Código Oficial de Transcodificação
```javascript
export async function convertBufferToWhatsAppAudio(inputBuffer) {
    const tempInput = path.join(tmpdir(), `wa_in_${Date.now()}_${Math.random().toString(36).substring(7)}.tmp`);
    const tempOutput = path.join(tmpdir(), `wa_out_${Date.now()}_${Math.random().toString(36).substring(7)}.ogg`);
    fsNative.writeFileSync(tempInput, inputBuffer);
    return new Promise((resolve, reject) => {
        ffmpeg(tempInput)
            .toFormat('ogg')
            .audioCodec('libopus')
            .audioChannels(1)
            .audioFrequency(48000)
            .outputOptions(['-b:a 32k', '-application voip', '-vbr on'])
            .on('end', () => {
                try {
                    const outputBuffer = fsNative.readFileSync(tempOutput);
                    try { fsNative.unlinkSync(tempInput); } catch(e) {}
                    try { fsNative.unlinkSync(tempOutput); } catch(e) {}
                    resolve(outputBuffer);
                } catch(e) { reject(e); }
            })
            .on('error', (err) => {
                try { fsNative.unlinkSync(tempInput); } catch(e) {}
                try { fsNative.unlinkSync(tempOutput); } catch(e) {}
                reject(err);
            })
            .save(tempOutput);
    });
}
```

**Padrões corretos de integração do áudio (enviar .ogg para WhatsApp E salvar .ogg no storage para o CRM):**
- Extrair `convId` **dinamicamente** da URL (nunca hardcode)
- Fazer SELECT prévio pelo ID da mensagem, depois UPDATE com `content: "[Audio] nome.ogg\nURL"` (NUNCA .order().limit() dentro de .update())
- Upload .ogg com `contentType: 'audio/ogg; codecs=opus'` e `upsert: true`
- Enviar waveform opcional via `Buffer.from(waveform)`

---

## 6. Sincronização de Grupos, Participantes & Contatos
- Grupos `@g.us`. `syncAllGroupsAndParticipants()` busca via `sock.groupFetchAllParticipating()`.
- Tratamento de @lid: armazenar em `remote_jid_alt`, query dupla `or(remote_jid, remote_jid_alt)`.

---

## 7. Ciclo de Deploy, Compilação TypeScript & Zero-Downtime
1. `ssh root@2.24.95.98`
2. `cd /root/crmahut/backend-broker`
3. `npm run build` (compila src → dist)
4. `pm2 reload whatsapp-broker` (zero-downtime)
5. `pm2 logs whatsapp-broker --lines 30 --nostream` (verificar "WhatsApp Broker iniciado")

---

## 8. Playbook de Resolução de Incidentes
### Incidente 1: WhatsApp desconectou sem gerar QR
- UPDATE whatsapp_sessions SET status='disconnected', qr_code=NULL, last_error=NULL WHERE id='...'
- pm2 restart 0
- Reconectar no CRM

### Incidente 2: Áudio não toca no WhatsApp
- `which ffmpeg && ffmpeg -version`
- `grep -i "Falha na conversão" /root/.pm2/logs/whatsapp-broker-out.log`
- `rm -f /tmp/wa_in_* /tmp/wa_out_*` (limpar temporários)

### Incidente 3: Corretor envia mas cliente não recebe
- `closeCode: 401` = celular oficial deslogou o aparelho (Meta limitou 4 dispositivos). Gerar novo QR.

---

## 9. Variáveis de Ambiente (.env) & Dependências Críticas
- Arquivo: /root/crmahut/backend-broker/.env
- PORT=3001, NODE_ENV=production, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- Pacotes: @whiskeysockets/baileys 7.x, fluent-ffmpeg, @supabase/supabase-js, pino

---

## 10. 🚫 As 10 Linhas Vermelhas da Arquitetura (O que NUNCA fazer)
1. **NUNCA** coloque código assíncrono após o `return` no session-manager.js (código morto).
2. **NUNCA** use `.order().limit()` dentro de `.update()` no Supabase (erro 400). Faça SELECT prévio por ID.
3. **NUNCA** passe `mimetype: 'audio/mp4'` para arquivos WebM no Baileys.
4. **NUNCA** hardcode UUIDs de conversas/tenants — extraia dinamicamente.
5. **NUNCA** delete a pasta `/auth_info/` com PM2 online — rode `pm2 stop 0` antes.
6. **NUNCA** altere o número de colunas da `messages` sem avisar o frontend (espera 8).
7. **NUNCA** suba arquivos sem extensão ao storage (precisa de Content-Type correto).
8. **NUNCA** desative o FFmpeg na VPS.
9. **NUNCA** altere a porta do broker sem atualizar proxies reversos.
10. **NUNCA** deixe de testar áudios em iPhone e Android reais antes de homologar.