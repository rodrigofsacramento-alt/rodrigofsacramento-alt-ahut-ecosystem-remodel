# Diagnóstico de Áudio no WhatsApp CRM

## Fluxo de Investigação (quando lead reporta "audio não funciona")

### 1. Verificar o Banco — `whatsapp_messages`

```sql
SELECT id, media_status, message_type, content, media_url, created_at
FROM whatsapp_messages
WHERE message_type = 'audio'
ORDER BY created_at DESC
LIMIT 10;
```

**Interpretação:**
- `media_status = 'downloaded'` + `media_url NOT NULL` → áudio baixado e upado com sucesso
- `media_status = 'failed'` → broker falhou ao baixar/processar
- `media_url IS NULL` → nunca foi upado ao storage

### 2. Verificar o Banco — `messages` (CRM)

```sql
SELECT id, message_type, content, created_at
FROM messages
WHERE content LIKE '%[Audio]%'
ORDER BY created_at DESC
LIMIT 10;
```

**Interpretação:**
- `content = "[Audio] filename.ext\nhttps://..."` → áudio foi processado e tem URL
- `content = "[midia]"` → áudio falhou (broker não conseguiu processar)
- `message_type` é sempre `'text'` mesmo para áudio — não confiar nessa coluna

### 3. Testar a URL Diretamente

```python
import urllib.request
req = urllib.request.Request(url, method='HEAD')
r = urllib.request.urlopen(req, timeout=10)
print(f'HTTP: {r.status}')
print(f'Type: {r.headers.get("Content-Type")}')
print(f'Size: {r.headers.get("Content-Length")}')
```

- HTTP 200 ✅ → URL acessível
- `Content-Type: audio/ogg` → formato OGG (nativo)
- `Content-Type: audio/webm` → formato WebM (precisa de suporte no player)

### 4. Comparar Working vs Failing

| Característica | Funcionou ✅ | Falhou ❌ |
|---|---|---|
| **Formato** | `.ogg` | `.webm` |
| **Content-Type** | `audio/ogg` | `audio/webm` |
| **Player suporta?** | ✅ Sim | ❌ Não (sem fix) |

### 5. Causas Raiz Conhecidas

| Causa | Sintoma | Fix |
|---|---|---|
| **Player sem suporte a webm** | URL 200, áudio existe, mas não toca | Adicionar `<source type="audio/webm">` no player |
| **Timeout de download (20s)** | `media_status = 'failed'`, `media_url = NULL` | Aumentar timeout para 60s + retry 2x |
| **`.single()` duplicado** | "JSON object requested, multiple rows" | Trocar por `.limit(1).order().maybeSingle()` |
| **Sessão desconectada** | `creds.json` não encontrado | Escanear QR code no CRM |
| **Conversão falha** | Log "Falha na conversão de áudio, enviando via URL fallback" | Fallback deve enviar buffer raw, não URL |

### 6. MediaRecorder — Comportamento por Browser

```javascript
// Chrome desktop: NÃO suporta audio/ogg
// Firefox: SUPORTA audio/ogg
// Chrome Android: SUPORTA audio/ogg
// Safari: NÃO suporta audio/ogg nem audio/webm (usa .m4a)

mime = MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
  ? "audio/ogg;codecs=opus"       // Firefox, Chrome Android
  : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"    // Chrome desktop fallback
    : "audio/webm"                // fallback genérico
```

### 7. Player `<audio>` — Sources Necessários

```jsx
<audio controls>
  <source src={url} type="audio/ogg; codecs=opus" />
  <source src={url} type="audio/ogg" />
  <source src={url} type="audio/webm" />      {/* ← ESSENCIAL para Chrome */}
  <source src={url} type="audio/mpeg" />
  <source src={url} type="audio/mp4" />
</audio>
```

## Comandos Úteis para Diagnóstico

```bash
# Testar URL do áudio
curl -s -o /dev/null -w "HTTP %{http_code}, Type: %{content_type}, Size: %{size_download}\n" "<url>"

# Verificar magic bytes
python3 -c "import urllib.request; r=urllib.request.urlopen('<url>'); print(r.read(4).hex())"
# OggS = 4f676753 (OGG válido)
# 1a45dfa3 = (WebM válido)

# Verificar status da sessão WhatsApp
PGPASSWORD='...' psql -h db.ptochsyoyatsydfysacc.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT id, status, phone_number, last_connected_at FROM whatsapp_sessions ORDER BY updated_at DESC;"

# Verificar logs recentes do broker
grep "audio\|Baixando\|Upload\|timeout\|convertido" /root/.pm2/logs/whatsapp-broker-out.log | tail -20
```