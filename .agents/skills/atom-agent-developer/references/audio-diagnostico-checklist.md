# Diagnóstico de Áudio Quebrado no WhatsApp (Broker + Frontend)

## Checklist de Diagnóstico

### 1. Verificar o banco
```sql
-- Últimos áudios processados
SELECT id, message_type, content, media_url, media_status, created_at
FROM messages WHERE content LIKE '%[Audio]%' ORDER BY created_at DESC LIMIT 10;

-- Comparar working vs failing
-- Working (14/08): .ogg, media_status='downloaded', message_type='audio'
-- Failing (agora): .webm, media_status='downloaded', message_type='text'
```

### 2. Verificar URLs no Storage
```bash
# HEAD request para ver Content-Type e tamanho
curl -s -I -o /dev/null -w "HTTP %{http_code}, Type: %{content_type}, Size: %{size_download}" <URL>

# Verificar cabeçalho do arquivo (OggS=OGG, 1a45dfa3=WebM)
curl -s <URL> | head -c 4 | xxd
```

### 3. Comparação Working vs Failing

| Característica | ✅ Funciona | ❌ Falha |
|---|---|---|
| Formato | `.ogg` | `.webm` |
| Content-Type | `audio/ogg` | `audio/webm` |
| Player sources | ogg/opus, ogg, mpeg, mp4 | ❌ **faltava webm** |
| Conversão broker | webm→ogg bem-sucedida | fallback envia URL com mime errado |

### 4. Correções Aplicadas

**Frontend (Atendimento-DcqAjCvf.js):** Adicionar source `audio/webm` ao `<audio>` player
```js
// Adicionar entre audio/ogg e audio/mpeg:
e.jsx("source",{src:n,type:"audio/webm"})
```

**Broker (session-manager.ts):** Fallback envia buffer raw em vez de URL
```ts
// Quando conversão webm→ogg falha:
const rawBuf = Buffer.from(await (await fetch(urlLine)).arrayBuffer());
return await sock.sendMessage(jid, { audio: rawBuf, mimetype: 'audio/webm', ptt: true });
```

### 5. Sessão WhatsApp
- Múltiplos restarts do broker podem deletar `creds.json`
- Sintoma: `ENOENT: .../creds.json` no log de erro
- Solução: verificar `whatsapp_sessions.status` no banco. Se `disconnected`, escanear QR
- Prevenção: agrupar múltiplos patches em UM restart só