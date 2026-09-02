import { supabase } from './supabase.js';
import { pino } from 'pino';
import { appendFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const CANAL_HERMES = '/opt/data/CANAL_LIVE.md';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const RODRIGO_CHAT_ID = '7654999049';

/**
 * WORKER DE ÁUDIO — REMODELAÇÃO DINÂMICA (02/09/2026)
 * Escuta INSERT em audit_logs (AUDIO_FAIL_REPORTED) via Supabase Realtime.
 * Quando um atendente aciona o botão "Falhou Áudio?" de QUALQUER lead:
 *   1. Resolve o lead real (conversation_id -> whatsapp_contacts => remote_jid/telefone)
 *   2. Baixa o áudio original do storage
 *   3. Re-upla com o marcador '_no_ptt_' (força o broker a enviar SEM ptt/waveform,
 *      o formato que destrava o celular do destinatário).
 *   4. Cria whatsapp_message para o lead real -> reenvio corrigido automático.
 *   5. Registra AUDIO_FAIL_RESOLVED.
 * Envios NORMAIS (fora do botão) continuam com ptt:true (inalterados).
 */
export function startAudioRecoveryWorker() {
  logger.info('[AudioRecovery] Ativo — REMODELAÇÃO DINÂMICA (correção SEM ptt p/ lead real)');

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

        logger.warn({ conversationId, audioUrl }, '[AudioRecovery] Incidente detectado. Iniciando remodelação dinâmica...');
        if (!audioUrl) { logger.error('[AudioRecovery] sem audioUrl; abortando'); return; }

        // 1) notifica Hermes (registro) e Rodrigo (Telegram)
        try { notifyHermes({ conversation_id: conversationId, audio_url: audioUrl, phone, lead_name: leadName, created_at: row.created_at }); }
        catch (e: any) { logger.warn('[AudioRecovery] falha notificar hermes', e?.message); }
        try { await notifyRodrigoTelegram({ leadName, phone: phone || conversationId, conversationId, audioUrl }); }
        catch (e: any) { logger.warn('[AudioRecovery] falha telegram', e?.message); }

        // 2) resolve o LEAD REAL dinamicamente
        const lead = await resolveLeadReal(conversationId, phone);
        if (!lead || !lead.remoteJid) {
          logger.error({ conversationId }, '[AudioRecovery] não resolveu o lead/destino real; registrando sem reenviar');
          await logOutcome(conversationId, leadName, '', audioUrl, false, 'não resolveu lead real');
          return;
        }
        logger.info({ lead: lead.remoteJid, name: lead.name }, '[AudioRecovery] lead real resolvido');

        // 3) remodela o áudio (re-upload com _no_ptt_) e reenvia para o lead real
        try {
          const novoUrl = await remodelarAudio(audioUrl, conversationId);
          if (!novoUrl) throw new Error('falha ao remodelar áudio');
          // cria whatsapp_message p/ o lead real -> broker converte e envia SEM ptt (marcador _no_ptt_)
          const created = await criarWhatsappMessage(lead, novoUrl, conversationId);
          logger.info({ why: created }, '[AudioRecovery] whatsapp_message de remodelação criado p/ lead real');
          await logOutcome(conversationId, leadName, lead.remoteJid, novoUrl, true, 'REMODELADO e reenviado (sem ptt) p/ lead real');
        } catch (e: any) {
          logger.error({ err: e?.message }, '[AudioRecovery] falha na remodelação/reenvio');
          await logOutcome(conversationId, leadName, lead.remoteJid, audioUrl, false, `falha remodelação: ${e?.message}`);
        }
      }
    )
    .subscribe((status: any) => {
      if (status === 'SUBSCRIBED') logger.info('[AudioRecovery] Inscrito com sucesso em audit_logs (Realtime).');
      else logger.warn('[AudioRecovery] canal: ' + status);
    });

  return channel;
}

/** Resolve o lead/destino real a partir da conversa (whatsapp_contacts) ou do phone. */
async function resolveLeadReal(conversationId: string, phoneFallback: string) {
  let remoteJid = '';
  let name = '';
  let tenantId = '';
  let sessionId = '';

  // 1) tenant/sessão da conversa
  if (conversationId) {
    const { data: conv } = await supabase.from('conversations').select('tenant_id').eq('id', conversationId).limit(1);
    if (conv && conv[0]) tenantId = (conv[0] as any).tenant_id || '';

    // sessão connected do tenant
    if (tenantId) {
      const { data: sess } = await supabase.from('whatsapp_sessions').select('id').eq('tenant_id', tenantId).eq('status', 'connected').limit(1);
      if (sess && sess[0]) sessionId = (sess[0] as any).id || '';
    }

    // contato whatsapp da conversa -> remote_jid (LID) / real
    const { data: wc } = await supabase.from('whatsapp_contacts')
      .select('remote_jid,remote_jid_alt,phone_number,display_name,name')
      .eq('conversation_id', conversationId).limit(5);
    if (wc && wc.length > 0) {
      const c = wc[0] as any;
      remoteJid = c.remote_jid || (c.remote_jid_alt || '');
      name = c.display_name || c.name || '';
      // se veio número cru, normaliza p/ @s.whatsapp.net
      if (remoteJid && !remoteJid.includes('@')) remoteJid = remoteJid + '@s.whatsapp.net';
    }
  }

  // 2) fallback: phone do incidente
  if (!remoteJid && phoneFallback) {
    remoteJid = phoneFallback.includes('@') ? phoneFallback : phoneFallback + '@s.whatsapp.net';
  }
  if (!remoteJid) return null;

  return { remoteJid, name, tenantId, sessionId };
}

/** Baixa o áudio original e re-upla com o marcador _no_ptt_ (para o broker enviar SEM ptt). */
async function remodelarAudio(audioUrl: string, conversationId: string): Promise<string | null> {
  try {
    const resp = await fetch(audioUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} ao baixar áudio: ${audioUrl}`);
    const buffer = Buffer.from(await resp.arrayBuffer());

    // nome com o marcador _no_ptt_ (dispara o envio sem ptt no session-manager)
    const ext = audioUrl.split('?')[0].split('.').pop() || 'ogg';
    const novoNome = `corrigido_${Date.now()}_no_ptt_.${ext}`;
    const chave = `${conversationId || 'geral'}/${novoNome}`;

    const { error: upErr } = await supabase.storage
      .from('chat-attachments')
      .upload(chave, buffer, { contentType: 'audio/ogg; codecs=opus', upsert: true });

    if (upErr) throw new Error('upload remodelado: ' + upErr.message);

    const publicUrl = supabase.storage.from('chat-attachments').getPublicUrl(chave).data.publicUrl;
    logger.info({ publicUrl }, '[AudioRecovery] áudio remodelado (marcador _no_ptt_) no storage');
    return publicUrl;
  } catch (e: any) {
    logger.error({ err: e?.message }, '[AudioRecovery] falha ao remodelar áudio');
    return null;
  }
}

/** Cria um whatsapp_message para o lead real com o áudio remodelado. */
async function criarWhatsappMessage(lead: any, audioUrl: string, conversationId: string) {
  // sessão connected (se não veio na resolução do lead, tenta de novo)
  let sessionId = lead.sessionId;
  if (!sessionId && lead.tenantId) {
    const { data: sess } = await supabase.from('whatsapp_sessions').select('id').eq('tenant_id', lead.tenantId).eq('status', 'connected').limit(1);
    if (sess && sess[0]) sessionId = (sess[0] as any).id || '';
  }
  if (!sessionId) {
    logger.error('[AudioRecovery] sem sessão connected; whatsapp_message ficará pending até reconectar');
  }
  const nome = (audioUrl.split('/').pop() || 'audio.ogg').split('?')[0];
  const content = `[Audio] ${nome}\n${audioUrl}`;
  const mid = randomUUID();
  const now = new Date().toISOString();
  const body: any = {
    id: mid,
    tenant_id: lead.tenantId,
    remote_jid: lead.remoteJid,
    from_me: true,
    message_type: 'audio',
    content,
    status: 'pending',
    processing_status: 'pending',
    media_status: 'none',
    retry_count: 0,
    created_at: now,
    updated_at: now,
  };
  if (sessionId) body.whatsapp_session_id = sessionId;
  const { error } = await supabase.from('whatsapp_messages').insert(body);
  if (error) throw new Error('insert whatsapp_message: ' + error.message);
  return mid;
}

function notifyHermes(info: any) {
  const line = `\n[${new Date().toISOString()}] 🚨 HERMES-ACÃO: chamado audio (remodelação). conversation_id=${info.conversation_id} audio_url=${info.audio_url} phone=${info.phone} lead=${info.lead_name}`;
  try { appendFileSync(CANAL_HERMES, line); } catch {}
}

async function notifyRodrigoTelegram(data: any) {
  if (!TELEGRAM_BOT_TOKEN) { logger.warn('[AudioRecovery] sem token; pulando'); return; }
  const text = `🚨 ERRO DE ÁUDIO DETECTADO\nLead: ${data.leadName}\nTelefone: ${data.phone}\nID Conversa: ${data.conversationId}\nStatus: Remodelação automática (sem ptt) iniciada.`;
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
      description: `${ok ? 'Audio remodelado e reenviado' : 'Falha na remodelação'} — ${msg}`,
      metadata: { leadName, dest, conversationId, audioUrl, autoRecovery: true, sem_ptt: ok, msg },
      created_at: new Date().toISOString(),
    });
  } catch (e: any) { logger.warn('[AudioRecovery] falha registrar', e?.message); }
}