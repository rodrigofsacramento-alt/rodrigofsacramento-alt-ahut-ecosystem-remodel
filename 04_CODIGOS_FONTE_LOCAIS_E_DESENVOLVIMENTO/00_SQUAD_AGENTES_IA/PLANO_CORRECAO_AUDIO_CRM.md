# 🔧 PLANO DE IMPLEMENTAÇÃO — CORREÇÃO DE ÁUDIO CRM

**Baseado no:** Manual Mestre RUNBOOK (Seção 5 - Pipeline de Áudio)
**Orientação:** Dev original
**Status:** Aprovado pelo Comandante

---

## 🐛 Diagnóstico

| Componente | Status | Problema |
|---|---|---|
| **Envio WhatsApp** | ✅ Funciona | Binary OGG enviado corretamente ao lead |
| **Player CRM** | ❌ Quebrado | .ogg nunca sobe pro storage (código após return) |
| **Upload .ogg Storage** | ❌ Código morto | Após `return await sock.sendMessage(...)` |
| **convId** | ❌ Hardcoded | `96e33b2e-0855-4ad4-b56a-af900747107b` fixo |
| **matchedMsgs** | ❌ `.ilike().limit(1)` | Mesmo erro que o dev corrigiu |

---

## 🛠️ Correção (Uma única alteração no session-manager.ts)

### Bloco [Audio] — Fluxo Completo

```typescript
// ANTES (ERRADO):
return await sock.sendMessage(jid, {
    audio: oggBuffer,
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true,
    waveform: Buffer.from(waveform)
});
// Upload ogg version → ❌ CÓDIGO MORTO (nunca executa)

// DEPOIS (CORRETO — seguindo manual do dev):
const sendResult = await sock.sendMessage(jid, {
    audio: oggBuffer,
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true,
    waveform: Buffer.from(waveform)
});

// 1. Extrai convId dinâmico da URL (sem hardcode)
const urlParts = urlLine.split('/');
const fileNameWithExt = urlParts[urlParts.length - 1] || `audio_${Date.now()}.webm`;
const convId = urlParts[urlParts.length - 2] || 'general';
const oggFileName = fileNameWithExt.replace(/\.[^/.]+$/, '') + '.ogg';
const oggFileKey = `${convId}/${oggFileName}`;

// 2. Upload do .ogg no Supabase Storage
const { error: upErr } = await supabase.storage
    .from('chat-attachments')
    .upload(oggFileKey, oggBuffer, {
        contentType: 'audio/ogg; codecs=opus',
        cacheControl: '3600',
        upsert: true
    });

if (!upErr) {
    const oggUrl = `https://ptochsyoyatsydfysacc.supabase.co/storage/v1/object/public/chat-attachments/${oggFileKey}`;
    
    // 3. SELECT prévio por ID (NUNCA .order().limit() no update)
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
    }
}

return sendResult;
```

---

## 📋 Passos

| # | Ação | Detalhe |
|---|---|---|
| 1 | **Copiar código do dev** para `session-manager.ts` | Substituir bloco [Audio] inteiro |
| 2 | **Compilar** | `npx tsc` (zero erros) |
| 3 | **Reload PM2** | `pm2 reload whatsapp-broker` |
| 4 | **Testar** | Gravar áudio no CRM → verificar player + storage |
| 5 | **Commit** | `ahut-ecosystem-active` |

---

## ✅ Critérios de Aceite

- [ ] Áudio gravado no CRM aparece `.ogg` no storage
- [ ] Player do CRM toca o áudio
- [ ] Lead recebe áudio no WhatsApp
- [ ] `convId` extraído dinamicamente (sem hardcode)
- [ ] SELECT prévio por ID antes de UPDATE
- [ ] `sendResult` capturado antes do upload