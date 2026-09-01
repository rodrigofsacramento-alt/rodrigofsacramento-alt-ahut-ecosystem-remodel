# 🎧 Áudio Fail-Safe — Atualização (validação 01/09/2026)

## O que foi implementado
Fluxo de contingência de áudio no WhatsApp validado de ponta a ponta.

## Arquitetura (quem resolve é o JARVIS, não o worker)
1. Botão "⚠️ Falhou Áudio?" (frontend) → INSERT em `audit_logs` (`AUDIO_FAIL_REPORTED`)
   - metadata: `audioUrl`, `phone`, `conversationId`
2. Worker do broker (`audio-recovery.ts`) escuta Realtime em `audit_logs` e **SÓ SINALIZA**:
   - notifica Hermes (CANAL_LIVE) + Rodrigo (Telegram) — **NÃO reenvia sozinho**
3. JARVIS (orquestrador) resolve:
   - audita o áudio (ffprobe: opus/48kHz mono)
   - reenvia para o **destinatário real** da conversa (produção) via `preparar_reenvio.py`
   - verifica o envio + registra `AUDIO_FAIL_RESOLVED`

## Requisitos críticos (aprendidos na validação)
- `audit_logs` DEVE estar na publicação `supabase_realtime` (senão o worker não recebe o INSERT).
- Formato obrigatório de content para virar PTT (não texto):
  `[Audio] <nome>.ogg\n<audioUrl>` — URL em LINHA SEPARADA (`\n`).
- Sessão WhatsApp `connected` é pré-requisito para o envio.
- Sempre auditar/diagnosticar o áudio ANTES de reenviar.
- Produção: destinatário = cliente real da conversa. (Fase de testes usou Rodrigo 5511988192658.)

## Arquivos
- `audio-recovery.ts` — worker (sinaliza incidente)
- `preparar_reenvio.py` — utilitário do JARVIS p/ reenvio (resolve destino real)
- `audio_incidentes_pendentes.sh` — detector p/ cron acionar o JARVIS
- `ORGANOGRAMA_SQUAD_QUBITS.md` — organograma do squad (AJAX = WhatsApp)

## Infra
- Broker PROD: `/root/crmahut/backend-broker` (PM2 `whatsapp-broker`, :3000)
- Supabase PROD: `ptochsyoyatsydfysacc`; DEV: `xmsulduzvufdzkfktovk`