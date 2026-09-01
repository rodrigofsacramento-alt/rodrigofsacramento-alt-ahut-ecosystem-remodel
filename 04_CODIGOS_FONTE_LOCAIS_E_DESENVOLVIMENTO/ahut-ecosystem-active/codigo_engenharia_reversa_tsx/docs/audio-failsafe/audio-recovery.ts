import { supabase } from './supabase.js';
import { sendMessage } from './session-manager.js';
import { pino } from 'pino';
import { appendFileSync } from 'node:fs';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const CANAL_HERMES = '/opt/data/CANAL_LIVE.md';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const RODRIGO_CHAT_ID = '7654999049';

// FASE DE TESTES: destino fixo = Rodrigo Sacramento
const TEST_PHONE = '5511988192658';

/**
 * WORKER DE ÁUDIO — REENVIO AUTÓNOMO (modo de testes)
 * Escuta INSERTs em audit_logs (AUDIO_FAIL_REPORTED) via Supabase Realtime.
 * Quando um incidente chega, resolve automaticamente:
 *   - notifica Hermes (CANAL_LIVE) e Rodrigo (Telegram)
 *   - reenvia o áudio para o Rodrigo (fase de testes) no formato correto
 *     [Audio] <nome>.ogg\n<URL> (URL em linha separada) => broker baixa,
 *     converte p/ OGG Opus e envia como PTT (não texto).
 */
export function startAudioRecoveryWorker() {
  logger.info('[AudioRecovery] Ativo — reenvio AUTONÓMO p/ Rodrigo (modo teste)');

  const channel = supabase
    .channel('broker-audio-recovery')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_logs' },
      async (payload: any) => {
        const row = payload.new;
        if (!row || row.action !== 'AUDIO_FAIL_REPORTED') return;

        let details: any = {};
        if (row.metadata && typeof row.metadata === 'object') details = row.metadata;
        else { try { details = JSON.parse(row.metadata || '{}'); } catch { details = {}; } }

        const conversationId = details.conversationId || details.conversation_id || row.resource_id || '';
        const audioUrl = details.audioUrl || details.audio_url || '';
        const leadName = details.leadName || row.description || 'Cliente';
        const phone = details.phone || '';

        logger.warn({ conversationId, audioUrl }, '[AudioRecovery] Incidente detectado. Resolvendo automaticamente...');
        if (!audioUrl) { logger.error('[AudioRecovery] sem audioUrl; abortando'); return; }

        // 1) notifica Hermes (registro) e Rodrigo (Telegram)
        try { notifyHermes({ conversation_id: conversationId, audio_url: audioUrl, phone, lead_name: leadName, created_at: row.created_at }); }
        catch (e: any) { logger.warn('[AudioRecovery] falha notificar hermes', e?.message); }
        try { await notifyRodrigoTelegram({ leadName, phone: phone || conversationId, conversationId, audioUrl }); }
        catch (e: any) { logger.warn('[AudioRecovery] falha telegram', e?.message); }

        // 2) NÃO reenvia automaticamente aqui. O JARVIS (orquestrador) assume a resolução:
        //    auditar, corrigir e reenviar para o Rodrigo. O worker apenas sinaliza o incidente
        //    ao Jarvis via CANAL_LIVE; o Jarvis executa o reenvio (controlado, auditado).
        logger.info({ conversationId, audioUrl }, '[AudioRecovery] Incidente sinalizado ao JARVIS. Aguardando Jarvis resolver.');
      }
    )
    .subscribe((status: any) => {
      if (status === 'SUBSCRIBED') logger.info('[AudioRecovery] Inscrito com sucesso em audit_logs (Realtime).');
      else logger.warn('[AudioRecovery] canal: ' + status);
    });

  return channel;
}

/** Reenvia o áudio no formato correto [Audio] nome.ogg\n<URL>. */
async function resendAudio(phone: string, audioUrl: string, conversationId: string): Promise<boolean> {
  const delays = [3000, 6000, 11000];
  let tenantId = '';
  let sessionName = 'default';
  if (conversationId) {
    const { data } = await supabase.from('conversations').select('tenant_id').eq('id', conversationId).limit(1);
    if (data && data[0]) tenantId = (data[0] as any).tenant_id || '';
    const sess = await supabase.from('whatsapp_sessions').select('session_name').eq('tenant_id', tenantId).eq('status', 'connected').maybeSingle();
    if (sess.data && (sess.data as any).session_name) sessionName = (sess.data as any).session_name;
  }
  const fileName = audioUrl.split('/').pop() || 'audio.ogg';
  // FORMATO CORRETO: URL em linha separada (essencial p/ broker baixar/converter)
  const content = `[Audio] ${fileName}\n${audioUrl}`;
  for (let i = 0; i < delays.length; i++) {
    try {
      await sendMessage(tenantId, sessionName, phone, content);
      logger.info({ attempt: i + 1, phone }, '[AudioRecovery] reenvio p/ Rodrigo OK');
      return true;
    } catch (err: any) {
      logger.warn({ attempt: i + 1, err: err?.message }, '[AudioRecovery] retry');
      if (i < delays.length - 1) await new Promise((r) => setTimeout(r, delays[i]));
    }
  }
  return false;
}

function notifyHermes(info: any) {
  const line = `\n[${new Date().toISOString()}] 🚨 HERMES-ACÃO: incidente audio. conversation_id=${info.conversation_id} audio_url=${info.audio_url} phone=${info.phone} lead=${info.lead_name}`;
  try { appendFileSync(CANAL_HERMES, line); } catch {}
}

async function notifyRodrigoTelegram(data: any) {
  if (!TELEGRAM_BOT_TOKEN) { logger.warn('[AudioRecovery] sem token; pulando'); return; }
  const text = `🚨 ERRO DE ÁUDIO DETECTADO\nLead: ${data.leadName}\nTelefone: ${data.phone}\nID Conversa: ${data.conversationId}\nStatus: Reenvio automático para Rodrigo.`;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: RODRIGO_CHAT_ID, text }),
    });
    if (!res.ok) throw new Error(`telegram ${res.status}`);
  } catch (e: any) { logger.warn('[AudioRecovery] telegram falhou', e?.message); }
}

async function logOutcome(conversationId: string, leadName: string, dest: string, audioUrl: string, ok: boolean, msg: string) {
  try {
    await supabase.from('audit_logs').insert({
      action: ok ? 'AUDIO_FAIL_RESOLVED' : 'AUDIO_FAIL_RETRY_EXHAUSTED',
      resource_type: 'audio',
      resource_id: conversationId || undefined,
      description: `${ok ? 'Audio reenviado p/ Rodrigo' : 'Falha retries'} — ${msg}`,
      metadata: { leadName, dest, conversationId, audioUrl, autoRecovery: true, msg },
      created_at: new Date().toISOString(),
    });
  } catch (e: any) { logger.warn('[AudioRecovery] falha registrar', e?.message); }
}