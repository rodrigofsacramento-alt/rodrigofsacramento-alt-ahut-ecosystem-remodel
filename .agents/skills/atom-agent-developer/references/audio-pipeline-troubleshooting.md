# Pipeline de Áudio — Diagnóstico e Troubleshooting

## Fluxo Completo (Dual Flow)

```
Usuário grava áudio no CRM → .webm no Supabase Storage
    │
    ▼
Broker detecta pending [Audio] message
    │
    ├── 1. Fetch .webm da URL
    ├── 2. FFmpeg converte para OGG Opus (32k VBR, mono, 48kHz, -application voip)
    ├── 3. Gera waveform
    │
    ├── FLUXO WHATSAPP: sendMessage(jid, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true, waveform })
    │
    └── FLUXO CRM STORAGE:
        ├── Extrai convId da URL (urlParts[urlParts.length - 2])
        ├── Upload .ogg no bucket chat-attachments com contentType: 'audio/ogg; codecs=opus'
        ├── SELECT id FROM messages WHERE conversation_id = convId AND ilike content
        └── UPDATE messages SET content = "[Audio] nome.ogg\nURL" WHERE id = matchedMsgs[0].id
```

## Diagnóstico de Falha

### Passo 1 — Verificar se o áudio chegou ao storage
```bash
curl -s -o /dev/null -w "HTTP %{http_code}, Type: %{content_type}, Size: %{size_download}\n" "<URL>"
```

### Passo 2 — Verificar formato do arquivo
- Magic bytes OGG: `OggS` (hex: 4f676753)
- Magic bytes WebM: `\x1a\x45\xdf\xa3`
```python
data = urllib.request.urlopen(url).read(4)
if data[:4] == b'\x1a\x45\xdf\xa3': print('WebM')
elif data[:4] == b'OggS': print('OGG')
```

### Passo 3 — Verificar logs do broker
```bash
grep -i "Falha na conversão\|timeout\|Baixando midia\|Áudio convertido" /root/.pm2/logs/whatsapp-broker-out.log | tail -20
```

### Passo 4 — Verificar banco
```sql
-- CRM messages
SELECT id, message_type, content, created_at FROM messages 
WHERE content LIKE '%[Audio]%' ORDER BY created_at DESC LIMIT 5;

-- Broker whatsapp_messages
SELECT id, status, media_status, media_url, created_at FROM whatsapp_messages 
WHERE message_type = 'audio' ORDER BY created_at DESC LIMIT 5;
```

## Causas Conhecidas

| Sintoma | Causa | Correção |
|---|---|---|
| "Este audio não está mais disponível" | `.single()` com múltiplos registros | `.limit(1).order().maybeSingle()` |
| Timeout no download | 20s insuficiente para áudio grande | Timeout 60s + retry 2x |
| Player não toca .webm | Source audio/webm faltando | Adicionar `<source type="audio/webm">` |
| Upload falha silenciosamente | Código após `return` (código morto) | Mover para antes do return |
| Sessão desconectada | `pm2 restart` deletou creds.json | Parar PM2 antes de limpar auth_info |