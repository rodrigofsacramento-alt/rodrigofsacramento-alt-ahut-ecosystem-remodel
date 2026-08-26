# Diagnóstico de Áudio WhatsApp — Fluxo de Referência

## Sintomas
- Lead reporta "Este audio não está mais disponível"
- Lead reporta "Não consigo abrir o audio"
- Player do CRM não mostra o play (mostra texto "[midia]" em vez de player)

## Fluxo de Diagnóstico Rápido

### Passo 1 — Verificar sessão WhatsApp
```sql
SELECT id, status, phone_number, last_connected_at, last_error
FROM whatsapp_sessions
WHERE tenant_id = 'fa440b34-5eb7-417d-b836-1184d229e427'
ORDER BY updated_at DESC LIMIT 1;
```
- Se `status != 'connected'` → QR code precisa ser escaneado
- Se `last_error` contém erro → investigar

### Passo 2 — Verificar áudios recentes no broker
```bash
grep -i "audio\|Baixando midia\|Upload concluído\|conversão\|convertido" /root/.pm2/logs/whatsapp-broker-out.log | tail -15
```

### Passo 3 — Comparar áudio que funciona vs áudio que falha
```sql
-- Buscar áudio que funcionou
SELECT id, message_type, content, created_at FROM messages
WHERE content LIKE '%[Audio]%' AND created_at > '2026-08-14'
ORDER BY created_at DESC LIMIT 5;

-- Buscar áudio no whatsapp_messages
SELECT id, media_status, media_url, content, created_at FROM whatsapp_messages
WHERE message_type = 'audio' ORDER BY created_at DESC LIMIT 5;
```

### Passo 4 — Testar URL do storage
```python
import urllib.request
url = "https://ptochsyoyatsydfysacc.supabase.co/storage/v1/object/public/chat-attachments/..."
req = urllib.request.Request(url, method='HEAD')
r = urllib.request.urlopen(req, timeout=10)
print(f'HTTP: {r.status}, Type: {r.headers.get("Content-Type")}, Size: {r.headers.get("Content-Length")}')
```

## Causas Raiz Conhecidas

| Causa | Sintoma | Fix |
|---|---|---|
| `.webm` sem suporte no player | Player mostra "Falhou o áudio" | Adicionar `audio/webm` nos sources do `<audio>` |
| Conversão webm→ogg falha | Log: "Falha na conversão de áudio" | Fallback: buffer raw com `audio/webm` |
| Timeout de 20s insuficiente | Log: "Media download timeout 20s" | Aumentar para 60_000 |
| `.single()` retorna múltiplos | Log: "JSON object requested, multiple rows" | Trocar por `.limit(1).order().maybeSingle()` |
| Sessão desconectada | Log: "401" ou "creds.json not found" | Escanear QR code no CRM |
| URL do storage expirada | HTTP 404 | Bucket público, mas verificar RLS |

## Comandos Úteis

### Verificar retry no compilado
```bash
grep -c "mediaDownloadAttempts" /root/crmahut/backend-broker/dist/session-manager.js
```

### Verificar compilação
```bash
cd /root/crmahut/backend-broker && npx tsc --noEmit 2>&1
```

### Restart broker
```bash
pm2 restart 0
```

### Verificar status broker
```bash
pm2 show 0 | grep -E "status|uptime|restarts|pid"
```

### Verificar sessão
```bash
PGPASSWORD='Dir@124!@$!@$' /usr/lib/postgresql/17/bin/psql -h db.ptochsyoyatsydfysacc.supabase.co -p 5432 -U postgres -d postgres -c "SELECT id, status, phone_number, updated_at::text FROM whatsapp_sessions WHERE status='connected'"
```

## Histórico de Correções

| Data | Commit | Correção |
|---|---|---|
| 25/08 | `a759ae2` | Timeout 20s→60s, retry 2x, log detalhado |
| 25/08 | `dc787e4` | `.single()` → `.limit(1)+.order()` em queries não-PK |
| 26/08 | `4852487` | P2: Conversão webm→ogg com re-upload no storage |