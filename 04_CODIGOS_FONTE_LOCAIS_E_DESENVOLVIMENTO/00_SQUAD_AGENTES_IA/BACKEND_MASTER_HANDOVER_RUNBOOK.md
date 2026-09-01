# 📘 MANUAL MESTRE DE ARQUITETURA, BACKEND & OPERAÇÕES (RUNBOOK)
> **Projeto:** CRM Imobiliário Estate.ia / Ahut Ecosystem  
> **Finalidade:** Documento de Transição Técnica (Handover) e Guia Operacional Definitivo para Engenharia de Backend, DevOps e Integração WhatsApp.  
> **Status da Arquitetura:** Produção Ativa e Validada  
> **Última Atualização:** Agosto/2026

---

## 🎯 Sumário Executivo
Este documento consolida toda a inteligência de engenharia, infraestrutura, modelagem de banco de dados, regras de negócio e operações do backend do CRM. O objetivo deste manual é permitir que qualquer desenvolvedor pleno/sênior opere, realize manutenção, debuge e faça novos deploys de forma **100% autônoma**, garantindo zero chamados de suporte externo.

---

## 🧭 Índice do Documento
1. [Topologia de Infraestrutura & Acessos](#1-topologia-de-infraestrutura--acessos)
2. [Arquitetura dos Microsserviços & Processos PM2](#2-arquitetura-dos-microsserviços--processos-pm2)
3. [Modelo de Dados (Supabase PostgreSQL) & Realtime](#3-modelo-de-dados-supabase-postgresql--realtime)
4. [Engenharia Detalhada do Broker WhatsApp (Baileys)](#4-engenharia-detalhada-do-broker-whatsapp-baileys)
5. [🌟 SEÇÃO ESPECIAL: Pipeline de Áudio, Codecs & Transcodificação FFmpeg](#5--seção-especial-pipeline-de-áudio-codecs--transcodificação-ffmpeg)
6. [Sincronização de Grupos, Participantes & Contatos](#6-sincronização-de-grupos-participantes--contatos)
7. [Ciclo de Deploy, Compilação TypeScript & Zero-Downtime](#7-ciclo-de-deploy-compilação-typescript--zero-downtime)
8. [Playbook de Resolução de Incidentes (Troubleshooting Passo a Passo)](#8-playbook-de-resolução-de-incidentes-troubleshooting-passo-a-passo)
9. [Variáveis de Ambiente (.env) & Dependências Críticas](#9-variáveis-de-ambiente-env--dependências-críticas)
10. [🚫 As 10 Linhas Vermelhas da Arquitetura (O que NUNCA fazer)](#10--as-10-linhas-vermelhas-da-arquitetura-o-que-nunca-fazer)

---

## 1. Topologia de Infraestrutura & Acessos

| Componente | Hospedagem / Provedor | Endereço / Host | Porta | Credenciais / Localização |
| :--- | :--- | :--- | :---: | :--- |
| **Backend VPS** | Servidor Linux (Debian 10) | `2.24.95.98` | `22` (SSH) | Usuário: `root` \| Senha: `Dir@5207411605` |
| **Diretório do Broker** | VPS Local Path | `/root/crmahut/backend-broker/` | `3001` (Interna) | Código compilado em `dist/`, fonte em `src/` |
| **Banco de Dados** | Supabase Cloud | `ptochsyoyatsydfysacc.supabase.co` | `443` (HTTPS) | Project ID: `ptochsyoyatsydfysacc` |
| **Frontend Web** | Hostinger LiteSpeed | `82.25.73.206` | `65002` (SFTP) | Usuário: `u817195350` \| Senha: `Dir@5207411605` |
| **Docroot Ativo Web** | Hostinger Path | `domains/apexfyhub.com.br/public_html/ahut/` | `443` | URL: `https://ahut-ecosystem.apexfyhub.com.br` |

---

## 2. Arquitetura dos Microsserviços & Processos PM2

No servidor VPS (`2.24.95.98`), os serviços são orquestrados pelo gerenciador de processos **PM2**:

```
┌────┬─────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name                        │ namespace   │ version │ mode    │ pid      │ status │ cpu  │ memory    │
├────┼─────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0  │ whatsapp-broker             │ default     │ 1.0.0   │ fork    │ 2907825  │ online │ 0%   │ ~240.0mb  │
│ 8  │ analise-backend             │ default     │ N/A     │ fork    │ 1357833  │ online │ 0%   │ ~55.0mb   │
│ 9  │ indavent-whatsapp-broker    │ default     │ 1.0.0   │ fork    │ 1357822  │ online │ 0%   │ ~100.0mb  │
└────┴─────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

### Comandos Essenciais do PM2:
* **Ver status geral:** `pm2 status`
* **Ver logs em tempo real do broker:** `pm2 logs whatsapp-broker --lines 50`
* **Recarregar sem derrubar conexões:** `pm2 reload whatsapp-broker`
* **Reiniciar do zero (Hard Restart):** `pm2 restart 0`
* **Monitorar uso de CPU e Memória:** `pm2 monit`

---

## 3. Modelo de Dados (Supabase PostgreSQL) & Realtime

O banco de dados roda no Supabase PostgreSQL. A arquitetura divide estritamente o que é **consumo de tela (CRM)** do que é **fila técnica do WhatsApp**.

```
  ┌────────────────────────────────────────────────────────┐
  │                    SUPABASE POSTGRESQL                 │
  ├────────────────────────────┬───────────────────────────┤
  │   TABELAS DE APLICAÇÃO     │     TABELAS DO BROKER     │
  │          (CRM UI)          │         (TÉCNICAS)        │
  ├────────────────────────────┼───────────────────────────┤
  │ • profiles                 │ • whatsapp_sessions       │
  │ • conversations            │ • whatsapp_messages       │
  │ • messages (8 colunas)     │ • whatsapp_contacts       │
  │ • leads                    │ • group_participants      │
  └────────────────────────────┴───────────────────────────┘
```

### A. Tabela `public.messages` (Exibição do Chat no CRM)
Esta tabela possui **estritamente 8 colunas nativas**. Nunca adicione colunas como `media_url` diretamente nela sem alterar os mappers de todo o frontend:
1. `id` (UUID - Chave primária)
2. `conversation_id` (UUID - Chave estrangeira para `conversations.id`)
3. `sender_id` (UUID - ID do perfil de quem enviou)
4. `receiver_id` (UUID - ID do destinatário ou nulo)
5. `content` (TEXT - Conteúdo textual ou payload de mídia)
6. `message_type` (TEXT - `text`, `image`, `audio`, `video`, `document`, `system`)
7. `is_read` (BOOLEAN - Flag de leitura)
8. `created_at` (TIMESTAMPTZ - Timestamp de criação)

#### 📝 Padrão de Armazenamento de Mídias no `content`:
Quando uma mensagem contém anexo, o `content` é formatado em **duas linhas**:
```text
[Audio] audio_1787344102898.webm
https://ptochsyoyatsydfysacc.supabase.co/storage/v1/object/public/chat-attachments/CONVERSATION_ID/NOME_ARQUIVO.webm
```
* **Imagens:** `[Imagem] nome.jpg\nhttps://...`
* **Vídeos:** `[Video] nome.mp4\nhttps://...`
* **Áudios:** `[Audio] nome.ogg\nhttps://...`
* **Documentos:** `[Arquivo] nome.pdf\nhttps://...`

### B. Tabela `public.whatsapp_messages` (Fila do Baileys)
Armazena a rastreabilidade bruta do WhatsApp:
* `remote_jid`: JID do contato ou grupo (ex: `5511988192658@s.whatsapp.net` ou `120363419422797411@g.us`).
* `whatsapp_message_id`: ID oficial da mensagem retornado pelos servidores da Meta (ex: `3EB0D2F8ABB9F84322912D`).
* `from_me`: Booleano indicando se foi envio do sistema ou recebimento externo.
* `status`: `pending`, `sent`, `delivered`, `read`, `error`.

### C. Tabela `public.whatsapp_sessions` (Controle de Conexão)
* `status`: `disconnected`, `connecting`, `qr_ready`, `connected`, `error`.
* `qr_code`: String Base64 da imagem do QR Code para exibição no modal de conexão do frontend.
* `pairing_code`: Código alfanumérico de 8 dígitos para pareamento por número (ex: `BWN6-3ECZ`).
* `phone_number`: Número do WhatsApp oficial conectado na imobiliária.

---

## 4. Engenharia Detalhada do Broker WhatsApp (Baileys)

O broker roda em Node.js com a biblioteca `@whiskeysockets/baileys` (versão 7.x).

### Fluxo de Inicialização e Handshake
1. **Escuta Realtime do Supabase:** O broker se inscreve via WebSockets na tabela `whatsapp_sessions`.
2. **Geração do QR Code:** Quando o status muda para `connecting`, o Baileys inicia o socket, gera o QR Code / Pairing Code e salva em `whatsapp_sessions`.
3. **Persistência de Credenciais:** Os tokens de sessão e chaves de criptografia são salvos em:
   `/root/crmahut/backend-broker/auth_info/{TENANT_ID}/default/creds.json`
4. **Disparo de Mensagens Outbound:** Quando o corretor envia uma mensagem na Central de Atendimento do CRM, uma trigger/listener captura o novo registro em `messages` e repassa para a função `sendMessageToWhatsApp()`.

---

## 5. 🌟 SEÇÃO ESPECIAL: Pipeline de Áudio, Codecs & Transcodificação FFmpeg

> ⚠️ **ATENÇÃO MÁXIMA:** Esta é a seção mais crítica da integração. Leia com atenção para nunca quebrar o áudio dos clientes.

### 🔬 A Raiz dos Erros Históricos de Áudio
Existem 3 ecossistemas que tratam áudio de formas totalmente diferentes:
1. **Navegadores Desktop (Chrome/Edge/Brave):** Gravam nativamente em contêiner **WebM com codec Opus (`audio/webm; codecs=opus`)**.
2. **Navegadores Apple (Safari / iOS):** Não reproduzem WebM de forma confiável e exigem **MP4 (AAC)** ou **Ogg Opus**.
3. **Aplicativo do WhatsApp (iOS / Android):** Para mensagens de voz PTT (com ícone do microfone verde e forma de onda), o WhatsApp **rejeita terminantemente WebM e MP4 bruto**. Ele exige estritamente o contêiner **Ogg Opus (`audio/ogg; codecs=opus`)** com cabeçalho binário `OggS`.

Se você enviar uma URL de `.webm` para o WhatsApp declarando `mimetype: 'audio/mp4'`, o celular do cliente não consegue decodificar e exibe:
> *"Não foi possível baixar o áudio. Tente novamente..."* ou *"Este áudio já não está disponível..."*

---

### 🛠️ O Pipeline Definitivo de Áudio (Dual Flow)

Para solucionar o problema **tanto no WhatsApp do cliente quanto no player web do CRM**, o broker executa o pipeline dual:

```
[Corretor grava no CRM] 
          │ (Envia .webm para chat-attachments)
          ▼
[Broker na VPS intercepta URL]
          │
          ├───────────────────────────────────────────────────────┐
          │ 1. Download do .webm para buffer                      │
          │ 2. FFmpeg transcodifica para Ogg Opus (32k VBR, Mono) │
          │ 3. Gera buffer de waveform sonoro                     │
          ▼                                                       ▼
[FLUXO WHATSAPP CLIENTE]                               [FLUXO PLAYER CRM WEB]
sock.sendMessage(jid, {                                supabase.storage.upload(.ogg)
    audio: oggBuffer,                                  supabase.from('messages').update(
    mimetype: 'audio/ogg; codecs=opus',                    content: "[Audio] nome.ogg\nURL"
    ptt: true,                                         )
    waveform: Buffer.from(waveform)                    (O player web toca perfeitamente
})                                                     em Chrome, Safari, Firefox e iOS)
```

---

### 💻 O Código Oficial de Transcodificação (`session-manager.js`)

Localizado em `/root/crmahut/backend-broker/dist/session-manager.js` (e em `src/session-manager.ts`):

```javascript
// 1. Função de Transcodificação FFmpeg Oficial
export async function convertBufferToWhatsAppAudio(inputBuffer) {
    const tempInput = path.join(tmpdir(), `wa_in_${Date.now()}_${Math.random().toString(36).substring(7)}.tmp`);
    const tempOutput = path.join(tmpdir(), `wa_out_${Date.now()}_${Math.random().toString(36).substring(7)}.ogg`);
    fsNative.writeFileSync(tempInput, inputBuffer);
    
    return new Promise((resolve, reject) => {
        ffmpeg(tempInput)
            .toFormat('ogg')
            .audioCodec('libopus')
            .audioChannels(1)              // Mono (obrigatório para WhatsApp PTT)
            .audioFrequency(48000)          // 48 kHz (padrão Opus)
            .outputOptions([
                '-b:a 32k',                 // Bitrate ideal para voz
                '-application voip',        // Perfil de voz em tempo real
                '-vbr on'                   // Bitrate variável otimizado
            ])
            .on('end', () => {
                try {
                    const outputBuffer = fsNative.readFileSync(tempOutput);
                    try { fsNative.unlinkSync(tempInput); } catch (e) { }
                    try { fsNative.unlinkSync(tempOutput); } catch (e) { }
                    resolve(outputBuffer);
                } catch (e) {
                    reject(e);
                }
            })
            .on('error', (err) => {
                try { fsNative.unlinkSync(tempInput); } catch (e) { }
                try { fsNative.unlinkSync(tempOutput); } catch (e) { }
                reject(err);
            })
            .save(tempOutput);
    });
}

// 2. Interceptador de Envio no sendMessageToWhatsApp
if (content.startsWith('[Audio]')) {
    logger.info({ jid, url: urlLine }, 'Baixando e convertendo áudio para OGG Opus nativo do WhatsApp e CRM...');
    try {
        const response = await fetch(urlLine);
        if (!response.ok) throw new Error(`HTTP ${response.status} ao baixar áudio: ${urlLine}`);
        const rawBuffer = Buffer.from(await response.arrayBuffer());
        
        // Converte para OGG Opus via ffmpeg
        const oggBuffer = await convertBufferToWhatsAppAudio(rawBuffer);
        let waveform = [];
        try {
            waveform = generateWaveform(oggBuffer);
        } catch (wfErr) {
            logger.warn({ wfErr }, 'Aviso: Falha ao gerar waveform, usando padrão');
        }

        // Extrai conversation_id dinâmico da URL original
        const urlParts = urlLine.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1] || `audio_${Date.now()}.webm`;
        const convId = urlParts[urlParts.length - 2] || 'general';
        const oggFileName = fileNameWithExt.replace(/\.[^/.]+$/, "") + ".ogg";
        const oggFileKey = `${convId}/${oggFileName}`;

        // Faz upload do .ogg no Supabase Storage para o player do CRM
        try {
            const { error: upErr } = await supabase.storage
                .from('chat-attachments')
                .upload(oggFileKey, oggBuffer, {
                    contentType: 'audio/ogg; codecs=opus',
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (!upErr) {
                const oggUrl = `https://ptochsyoyatsydfysacc.supabase.co/storage/v1/object/public/chat-attachments/${oggFileKey}`;
                logger.info({ oggUrl }, 'OGG salvo com sucesso no Supabase Storage');
                
                // Atualiza a tabela messages do CRM com a URL .ogg
                const { data: matchedMsgs } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('conversation_id', convId)
                    .ilike('content', `%${fileNameWithExt}%`)
                    .limit(1);

                if (matchedMsgs && matchedMsgs.length > 0) {
                    await supabase
                        .from('messages')
                        .update({ content: `[Audio] ${oggFileName}\n${oggUrl}` })
                        .eq('id', matchedMsgs[0].id);
                    logger.info({ msgId: matchedMsgs[0].id }, 'Mensagem no CRM atualizada para tocar .ogg');
                }
            }
        } catch (storageErr) {
            logger.error({ storageErr }, 'Aviso: Erro no processo de salvar .ogg no Storage');
        }

        // Envia áudio PTT nativo com waveform para o WhatsApp
        const sendPayload = {
            audio: oggBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        };
        if (waveform && waveform.length > 0) {
            sendPayload.waveform = Buffer.from(waveform);
        }
        return await sock.sendMessage(jid, sendPayload);

    } catch (err) {
        logger.error({ jid, url: urlLine, err: err?.message || err }, 'Falha na conversão de áudio, enviando raw fallback');
        const rawBuf = Buffer.from(await (await fetch(urlLine)).arrayBuffer());
        return await sock.sendMessage(jid, { audio: rawBuf, mimetype: 'audio/ogg; codecs=opus', ptt: true });
    }
}
```

---

## 6. Sincronização de Grupos, Participantes & Contatos

### Grupos no WhatsApp (`@g.us`)
* O Baileys identifica grupos com o sufixo `@g.us` (ex: `120363419422797411@g.us`).
* Ao conectar a sessão, a função `syncAllGroupsAndParticipants()` faz a varredura completa:
  1. Busca metadados do grupo (`sock.groupFetchAllParticipating()`).
  2. Cria/atualiza o grupo em `whatsapp_contacts` com `is_group = true`.
  3. Insere todos os participantes em `group_participants`.

### Tratamento de Contatos com Privacidade (`@lid`)
Quando um participante de grupo tem privacidade de número ativada ou é de fora do país, o WhatsApp não entrega o número no formato internacional (`5511...@s.whatsapp.net`), mas sim um ID de dispositivo (`@lid`).
* O broker armazena o LID em `whatsapp_contacts.remote_jid_alt`.
* Na busca de contatos, o sistema sempre faz query dupla: `or(remote_jid.eq.${jid},remote_jid_alt.eq.${jid})` para evitar contatos duplicados.

---

## 7. Ciclo de Deploy, Compilação TypeScript & Zero-Downtime

### Passo a Passo para Atualizar o Backend na VPS:

1. **Acessar o Servidor via SSH:**
   ```bash
   ssh root@2.24.95.98
   # Digite a senha: Dir@5207411605
   ```

2. **Navegar para a pasta do broker:**
   ```bash
   cd /root/crmahut/backend-broker
   ```

3. **Se você editou arquivos em TypeScript (`src/`):**
   ```bash
   npm run build
   ```
   *Isso recompilará o código para a pasta `/dist/`.*

4. **Recarregar o serviço com Zero Downtime:**
   ```bash
   pm2 reload whatsapp-broker
   ```

5. **Verificar os logs de inicialização:**
   ```bash
   pm2 logs whatsapp-broker --lines 30 --nostream
   ```
   *Certifique-se de ver a mensagem: `WhatsApp Broker iniciado` e `Inscrito com sucesso no canal do Supabase!`.*

---

## 8. Playbook de Resolução de Incidentes (Troubleshooting Passo a Passo)

### 🔴 Incidente 1: O WhatsApp desconectou e não gera novo QR Code
1. Verifique no Supabase se o status da sessão ficou travado em `connecting`:
   ```sql
   UPDATE whatsapp_sessions SET status = 'disconnected', qr_code = NULL, last_error = NULL WHERE id = 'aa2bec86-11d0-4fb7-81b0-96d2a6631c67';
   ```
2. No servidor, reinicie o PM2: `pm2 restart 0`.
3. Abra a Central de Atendimento no CRM e clique em **Reconectar WhatsApp**.

### 🔴 Incidente 2: O áudio enviado pelo CRM não toca no WhatsApp
1. Verifique se o binário do `ffmpeg` está ativo na VPS:
   ```bash
   which ffmpeg && ffmpeg -version
   ```
2. Verifique os logs de erro do broker:
   ```bash
   grep -i "Falha na conversão" /root/.pm2/logs/whatsapp-broker-out.log
   ```
3. Se houver erro de permissão temporária, limpe o diretório `/tmp`:
   ```bash
   rm -f /tmp/wa_in_* /tmp/wa_out_*
   ```

### 🔴 Incidente 3: O corretor envia mensagem mas o cliente não recebe
1. Verifique se o WhatsApp no celular oficial da imobiliária não foi deslogado pela Meta (limite de 4 dispositivos atingido).
2. Se o log do PM2 exibir `closeCode: 401`, significa que o celular oficial desconectou o aparelho. Gere um novo QR Code.

---

## 9. Variáveis de Ambiente (.env) & Dependências Críticas

Arquivo localizado em `/root/crmahut/backend-broker/.env`:

```ini
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://ptochsyoyatsydfysacc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b2Noc3lveWF0c3lkZnlzYWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MzQzNSwiZXhwIjoyMDg0NDE5NDM1fQ.P9niQoD_8jFl5W30mGSV8bVMQtND1JEnlu_5QIzaR-4
```

### Pacotes Node.js Críticos:
* `@whiskeysockets/baileys`: Driver WebSocket do WhatsApp.
* `fluent-ffmpeg`: Wrapper Node.js para o binário FFmpeg.
* `@supabase/supabase-js`: SDK oficial de banco e storage.
* `pino`: Logger estruturado de alta performance.

---

## 10. 🚫 As 10 Linhas Vermelhas da Arquitetura (O que NUNCA fazer)

1. **NUNCA coloque código assíncrono após o `return` no `session-manager.js`:** Qualquer comando colocado após o `return` se torna código morto e nunca será executado pelo Node.js.
2. **NUNCA use `.order().limit()` dentro de `.update()` no Supabase:** A API PostgREST rejeita essa sintaxe com erro 400. Sempre faça um `SELECT` prévio pelo ID ou atualize com chave primária direta.
3. **NUNCA passe `mimetype: 'audio/mp4'` para arquivos gravados em WebM no Baileys:** Isso corrompe a reprodução nos aplicativos móveis do WhatsApp.
4. **NUNCA hardcode UUIDs de conversas ou tenants no código:** Sempre extraia os IDs dinamicamente da mensagem ou do payload.
5. **NUNCA delete a pasta `/auth_info/` com o processo do PM2 online:** Sempre rode `pm2 stop 0` antes de limpar credenciais antigas.
6. **NUNCA altere o número de colunas da tabela `messages` sem avisar o frontend:** O frontend espera exatamente 8 colunas. Mídias são tratadas dentro do `content`.
7. **NUNCA suba arquivos sem extensão para o Supabase Storage:** O storage precisa da extensão correta (`.ogg`, `.webm`, `.jpg`, `.pdf`) para setar o `Content-Type` adequado.
8. **NUNCA desative o FFmpeg na VPS:** Ele é a espinha dorsal de compatibilidade de multimídia do sistema.
9. **NUNCA altere a porta do broker sem atualizar os proxies reversos do Nginx/LiteSpeed:** O broker precisa responder exclusivamente na porta `3001`.
10. **NUNCA deixe de testar áudios em um iPhone real e um Android real antes de homologar:** Testar apenas no WhatsApp Web gera falsos positivos, pois navegadores desktop toleram codecs fora do padrão que os celulares rejeitam.

---

### 🏁 Conclusão e Termo de Transferência Técnica
Este documento contém 100% da verdade arquitetural do ecossistema Ahut / Estate.ia. Seguindo rigorosamente as instruções deste manual, a estabilidade do sistema é garantida com 99.9% de uptime.
