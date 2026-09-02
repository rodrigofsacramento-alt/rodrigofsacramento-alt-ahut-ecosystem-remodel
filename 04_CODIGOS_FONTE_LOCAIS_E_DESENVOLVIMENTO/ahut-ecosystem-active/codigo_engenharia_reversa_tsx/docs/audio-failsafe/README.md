# 🎧 Atualização de Áudio — Remodelação Dinâmica (02/09/2026)

## Problema resolvido
Quando um lead reportava áudio "indisponível"/"sem áudio" no celular (mas o Web tocava),
a causa raiz era o **modo PTT (`ptt:true` — "voice message")**: o celular do destinatário
não decodificava o voice-note, exibindo "áudio indisponível".

**Evidência (caso Ângel Cardozo, 02/09):** o envio COM `ptt:true` falhava no celular;
reenviar SEM `ptt`/`waveform` (como "Audio" normal) → tocou e o lead confirmou.

## Correção implementada (dinâmica p/ QUALQUER lead)
- **Envio NORMAL de áudio** → mantido com `ptt:true` (inalterado, igual antes).
- **Somente quando o atendente acionar o botão "⚠️ Falhou Áudio?"** → dispara a **REMODELAÇÃO**:
  1. Worker `audio-recovery.ts` (Realtime em `audit_logs`) recebe `AUDIO_FAIL_REPORTED`
  2. Resolve o **lead real** dinamicamente (conversation_id → `whatsapp_contacts` → remote_jid/telefone)
  3. Baixa o áudio original do storage e re-upla com o marcador **`_no_ptt_`**
  4. `session-manager.ts` detecta o marcador `_no_ptt_`/`_teste_` e envia **SEM `ptt` e SEM `waveform`**
  5. Registra `AUDIO_FAIL_RESOLVED` no audit_logs

## Arquivos alterados
- `docs/audio-failsafe/audio-recovery.ts` — worker (remodelação dinâmica)
- `docs/audio-failsafe/session-manager.ts` — envio sem ptt quando marcador `_no_ptt_`
- `docs/audio-failsafe/README.md` — este doc

## Comportamento
| Cenário | Envio |
|---|---|
| Áudio normal (sem botão de erro) | `ptt:true` (voice message, como antes) |
| Botão "Falhou Áudio?" acionado | Reenvio **sem ptt/waveform** ("Audio" normal) → destrava celular |

## Rollback
Backup: `/root/crmahut/backend-broker.BACKUP_20260902_135950.tar.gz`
Script: `/opt/data/scripts/rollback_broker.sh`