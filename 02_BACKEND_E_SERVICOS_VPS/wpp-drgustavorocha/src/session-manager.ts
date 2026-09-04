import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  Browsers,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
} from 'baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { supabase } from './supabase.js';
import { pino } from 'pino';
import { randomUUID } from 'node:crypto';
import { rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import * as fsNative from 'node:fs';
import ffmpeg from 'fluent-ffmpeg';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

interface SessionRecord {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  session_name: string;
  status: string;
  phone_number?: string | null;
  last_error?: string | null;
}

const activeSockets = new Map<string, WASocket>();
const startingSessions = new Set<string>();
const connectionTimestamps = new Map<string, number>();
const profilePicBackfillTimers = new Map<string, NodeJS.Timeout>();

export function isSessionStarting(tenantId: string, sessionName: string): boolean {
  return startingSessions.has(`${tenantId}:${sessionName}`);
}

export function isSocketFullyConnected(tenantId: string, sessionName: string): boolean {
  const sessionKey = `${tenantId}:${sessionName}`;
  const sock = activeSockets.get(sessionKey);
  return !!sock && connectionTimestamps.has(sessionKey);
}

function stopProfilePicBackfill(sessionKey: string) {
  const timer = profilePicBackfillTimers.get(sessionKey);
  if (timer) {
    clearInterval(timer);
    profilePicBackfillTimers.delete(sessionKey);
  }
}

function normalizePhone(value: string) {
  return value.split('@')[0].split(':')[0].replace(/\D/g, '');
}

export function cleanWhatsappName(value?: string | null) {
  const name = (value || '').trim().replace(/\s+/g, ' ');
  if (!name) return '';

  const normalized = name.toLowerCase();
  const digitsOnly = name.replace(/\D/g, '');
  const technicalMarkers = [
    'deleted-self-whatsapp',
    'self-whatsapp',
    'deleted-whatsapp',
    'unknown',
    'undefined',
    'null',
  ];

  if (technicalMarkers.some((marker) => normalized.includes(marker))) return '';
  if (name.includes('@s.whatsapp.net') || name.includes('@lid')) return '';
  if (/^\[.*\]$/.test(name) && normalized.includes('deleted')) return '';
  if (digitsOnly.length >= 10 && digitsOnly === name.replace(/\D/g, '')) return '';

  return name;
}

export function isWeakWhatsappName(value?: string | null, phone?: string | null) {
  const name = (value || '').trim();
  if (!name) return true;
  if (!cleanWhatsappName(name)) return true;
  const digitsOnly = name.replace(/\D/g, '');
  const phoneOnly = normalizePhone(phone || '');
  return !!digitsOnly && digitsOnly === phoneOnly;
}

function resolveWhatsappDisplayName(
  pushName: string | null | undefined,
  existingContactName: string | null | undefined,
  phone: string,
) {
  const name = cleanWhatsappName(pushName);
  if (name && name.includes(" - ") && name.split(" ").length > 3) {
    return phone || "Membro do Grupo";
  }
  return name
    || cleanWhatsappName(existingContactName)
    || phone
    || 'Cliente WhatsApp';
}

async function ensureWhatsappLead(params: {
  tenantId: string;
  phone: string;
  name: string;
  profileId?: string | null;
  conversationId?: string | null;
  createdBy?: string | null;
  tags?: string[];
}) {
  const phone = normalizePhone(params.phone);
  if (!params.tenantId || !phone) return null;

  const name = cleanWhatsappName(params.name) || `Cliente ${phone.slice(-4) || 'WhatsApp'}`;
  const now = new Date().toISOString();

  const { data: existingLead, error: lookupError } = await supabase
    .from('leads')
    .select('id, name, phone, stage, source, tags')
    .eq('tenant_id', params.tenantId)
    .eq('phone', phone)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existingLead?.id) {
    const shouldPatchName = isWeakWhatsappName(existingLead.name, phone) && !isWeakWhatsappName(name, phone);
    const existingTags = existingLead.tags || [];
    const mergedTags = Array.from(new Set([...existingTags, ...(params.tags || [])]));
    
    const updatePayload: Record<string, any> = {
      phone,
      source: existingLead.source || 'WhatsApp',
      tags: mergedTags,
      updated_at: now,
    };
    if (shouldPatchName) updatePayload.name = name;

    const { error: updateError } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', existingLead.id)
      .eq('tenant_id', params.tenantId);

    if (updateError) throw updateError;
    return existingLead.id as string;
  }

  const { data: insertedLead, error: insertError } = await supabase
    .from('leads')
    .insert({
      tenant_id: params.tenantId,
      name,
      phone,
      source: 'WhatsApp',
      stage: 'Primeiro Atendimento',
      score: 50,
      sla_status: 'ok',
      responsible_id: null,
      created_by: params.createdBy || null,
      tags: params.tags || [],
      notes: [
        'Lead criado automaticamente pelo WhatsApp.',
        params.profileId ? `profile_id: ${params.profileId}` : null,
        params.conversationId ? `conversation_id: ${params.conversationId}` : null,
      ].filter(Boolean).join('\n'),
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  if (insertedLead?.id) {
    const { error: timelineError } = await supabase
      .from('lead_timeline')
      .insert({
        lead_id: insertedLead.id,
        type: 'lead_created',
        title: 'Lead WhatsApp criado',
        description: 'Lead criado automaticamente a partir de uma conversa recebida no WhatsApp.',
        user_id: params.createdBy || null,
      });

    if (timelineError) {
      logger.warn({ err: timelineError.message, leadId: insertedLead.id }, 'Nao foi possivel criar timeline do lead WhatsApp');
    }
  }

  return insertedLead?.id || null;
}

function normalizePairingPhone(value?: string | null) {
  const phone = normalizePhone(value || '');
  return phone.length >= 10 ? phone : '';
}

function canonicalRemoteJid(remoteJid: string, realPhone?: string | null) {
  const phone = normalizePhone(realPhone || remoteJid);
  if (phone.startsWith('55') && phone.length >= 12 && phone.length <= 13) {
    return `${phone}@s.whatsapp.net`;
  }
  return remoteJid;
}

async function updateBrokerHealth(
  session: SessionRecord,
  patch: {
    status?: string;
    last_event_at?: string;
    last_success_at?: string;
    last_error_at?: string;
    last_error?: string | null;
  },
) {
  try {
    await supabase
      .from('whatsapp_broker_health')
      .upsert({
        tenant_id: session.tenant_id,
        whatsapp_session_id: session.id,
        session_name: session.session_name,
        status: patch.status || session.status || 'unknown',
        broker_pid: Number(process.pid || 0),
        ...patch,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'whatsapp_session_id' });
  } catch (err: any) {
    logger.warn({ err: err?.message || err }, 'Falha ao atualizar health do broker');
  }
}

async function claimMessageProcessing(params: {
  session: SessionRecord;
  whatsappMessageId: string;
  remoteJid: string;
  canonicalJid: string;
  isFromMe: boolean;
  eventType: string;
  messageType: string;
}) {
  const now = new Date().toISOString();
  const direction = params.isFromMe ? 'outgoing' : 'incoming';
  const { data, error } = await supabase
    .from('whatsapp_message_processing')
    .insert({
      tenant_id: params.session.tenant_id,
      whatsapp_session_id: params.session.id,
      whatsapp_message_id: params.whatsappMessageId,
      remote_jid: params.remoteJid,
      canonical_remote_jid: params.canonicalJid,
      direction,
      event_type: params.eventType,
      message_type: params.messageType,
      status: 'processing',
      media_status: params.messageType === 'text' || params.messageType === 'location' ? 'none' : 'pending',
      first_seen_at: now,
      last_seen_at: now,
    })
    .select('id')
    .single();

  if (!error) return { claimed: true, id: data?.id as string | undefined };

  if ((error as any).code === '23505' || error.message?.includes('duplicate key')) {
    await supabase
      .from('whatsapp_message_processing')
      .update({
        status: 'duplicate',
        last_seen_at: now,
        attempts: 2,
        error: 'Mensagem duplicada recebida pelo broker',
      })
      .eq('whatsapp_session_id', params.session.id)
      .eq('whatsapp_message_id', params.whatsappMessageId);
    return { claimed: false };
  }

  logger.warn({ err: error.message, msgId: params.whatsappMessageId }, 'Falha ao criar claim de processamento');
  return { claimed: true };
}

async function finishMessageProcessing(
  processingId: string | undefined,
  status: 'processed' | 'failed' | 'ignored',
  mediaStatus: 'none' | 'downloaded' | 'failed',
  error?: string | null,
) {
  if (!processingId) return;
  await supabase
    .from('whatsapp_message_processing')
    .update({
      status,
      media_status: mediaStatus,
      error: error || null,
      processed_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', processingId);
}

function getMessageContent(msg: any) {
  return msg.message?.conversation
    || msg.message?.extendedTextMessage?.text
    || msg.message?.imageMessage?.caption
    || msg.message?.videoMessage?.caption
    || msg.message?.documentMessage?.caption
    || '[midia]';
}

function getMessageType(msg: any) {
  if (msg.message?.imageMessage) return 'image';
  if (msg.message?.videoMessage) return 'video';
  if (msg.message?.audioMessage) return 'audio';
  if (msg.message?.documentMessage) return 'document';
  if (msg.message?.locationMessage || msg.message?.liveLocationMessage) return 'location';
  return 'text';
}

async function findAuthUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((item: any) => item.email?.toLowerCase() === normalizedEmail);
    if (user) return user;
    if (data.users.length < 1000) break;
  }

  return null;
}

// Converte buffer de qualquer formato de áudio para Ogg Opus via FFmpeg (obrigatório para WhatsApp + compatibilidade web)
async function convertAudioBufferToOgg(inputBuffer: Buffer): Promise<Buffer> {
  const tempInput = path.join(tmpdir(), `recv_in_${Date.now()}_${randomUUID().substring(0,8)}.tmp`);
  const tempOutput = path.join(tmpdir(), `recv_out_${Date.now()}_${randomUUID().substring(0,8)}.ogg`);
  fsNative.writeFileSync(tempInput, inputBuffer);
  return new Promise<Buffer>((resolve, reject) => {
    ffmpeg(tempInput)
      .toFormat('ogg')
      .audioCodec('libopus')
      .audioChannels(1)
      .audioFrequency(48000)
      .outputOptions(['-b:a 32k', '-application voip', '-vbr on'])
      .on('end', () => {
        try {
          const out = fsNative.readFileSync(tempOutput);
          try { fsNative.unlinkSync(tempInput); } catch (_) {}
          try { fsNative.unlinkSync(tempOutput); } catch (_) {}
          resolve(out);
        } catch (e) { reject(e); }
      })
      .on('error', (err: Error) => {
        try { fsNative.unlinkSync(tempInput); } catch (_) {}
        try { fsNative.unlinkSync(tempOutput); } catch (_) {}
        reject(err);
      })
      .save(tempOutput);
  });
}

// Helper to download media from Baileys and upload to Supabase Storage
async function downloadAndUploadMedia(sock: WASocket, msg: any, messageType: string) {
  try {
    logger.info({ messageId: msg.key.id, type: messageType }, 'Baixando mídia do WhatsApp...');
    let buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger: pino({ level: 'warn' }),
        reuploadRequest: sock.updateMediaMessage
      }
    ) as Buffer;

    if (!buffer) {
      logger.error('Não foi possível obter o buffer do download da mídia');
      return null;
    }

    // Determine extension and content type
    let ext = 'bin';
    let contentType = 'application/octet-stream';
    const message = msg.message;
    
    if (messageType === 'image') {
      ext = 'jpg';
      contentType = 'image/jpeg';
    } else if (messageType === 'video') {
      ext = 'mp4';
      contentType = 'video/mp4';
    } else if (messageType === 'audio') {
      // ⚠️ OBRIGATÓRIO: converter WebM → Ogg Opus via FFmpeg.
      // O Baileys entrega WebM bruto. Salvar como .ogg sem converter quebra
      // o player web (Safari/iOS) e o WhatsApp do cliente.
      try {
        logger.info({ messageId: msg.key.id }, 'Convertendo áudio recebido: WebM → Ogg Opus via FFmpeg...');
        buffer = await convertAudioBufferToOgg(buffer);
        logger.info({ messageId: msg.key.id, size: buffer.length }, 'Áudio convertido com sucesso para Ogg Opus.');
      } catch (convErr: any) {
        logger.error({ err: convErr?.message, messageId: msg.key.id }, 'FFmpeg falhou na conversão de áudio recebido — usando buffer raw como fallback.');
      }
      ext = 'ogg';
      contentType = 'audio/ogg; codecs=opus';
    } else if (messageType === 'document') {
      const doc = message?.documentMessage;
      ext = doc?.fileName?.split('.').pop() || 'bin';
      contentType = doc?.mimetype || 'application/octet-stream';
    }

    const fileName = `${msg.key.id}.${ext}`;
    const fileKey = `${randomUUID()}_${fileName}`;
    const bucketName = 'chat-attachments';

    logger.info({ fileKey }, 'Fazendo upload da mídia para Supabase Storage...');
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileKey, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      logger.error({ error }, 'Erro ao enviar mídia para Supabase Storage');
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileKey);

    logger.info({ publicUrl: publicUrlData.publicUrl }, 'Upload concluído e URL pública obtida.');
    return {
      publicUrl: publicUrlData.publicUrl,
      fileName: message?.documentMessage?.fileName || fileName,
      mimeType: contentType,
      size: buffer.length
    };
  } catch (err) {
    logger.error({ err }, 'Erro no helper downloadAndUploadMedia');
    return null;
  }
}

// Cache de sincronizações recentes para evitar baixar a mesma foto várias vezes
const profilePicSyncCache = new Map<string, number>();
const PROFILE_PIC_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

async function syncProfilePicture(
  sock: WASocket,
  tenantId: string,
  profileId: string,
  remoteJid: string
): Promise<void> {
  const cacheKey = `${tenantId}:${remoteJid}`;
  const lastSync = profilePicSyncCache.get(cacheKey);
  if (lastSync && Date.now() - lastSync < PROFILE_PIC_CACHE_TTL_MS) {
    return; // já sincronizou recentemente
  }

  // 1. Determinar quais JIDs tentar.
  // Contatos @lid geralmente NÃO retornam foto direto — preciso resolver para o numero de telefone (@s.whatsapp.net).
  const jidsToTry: string[] = [];
  if (remoteJid.endsWith('@lid')) {
    // Buscar o phone_number no whatsapp_contacts para construir o JID @s.whatsapp.net
    const { data: contactRow } = await supabase
      .from('whatsapp_contacts')
      .select('phone_number')
      .eq('tenant_id', tenantId)
      .eq('remote_jid', remoteJid)
      .maybeSingle();
    if (contactRow?.phone_number) {
      jidsToTry.push(`${contactRow.phone_number}@s.whatsapp.net`);
    }
    jidsToTry.push(remoteJid); // fallback ao @lid
  } else {
    jidsToTry.push(remoteJid);
  }

  // Pedir URL da imagem para o WhatsApp (URL é temporária)
  // Usar 'preview' (thumb low-res) é mais permissivo que 'image' (full res, geralmente restrito por privacidade)
  // Timeout curto (8s) — sem isso o WhatsApp pode pendurar a request 45s+ quando o contato não tem foto visível.
  let waUrl: string | null = null;
  let lastErr: any = null;
  for (const jid of jidsToTry) {
    try {
      waUrl = await Promise.race<string | null>([
        (sock as any).profilePictureUrl(jid, 'preview'),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('profilePictureUrl timeout 8s')), 8000)),
      ]);
      if (waUrl && typeof waUrl === 'string') {
        break; // sucesso
      }
    } catch (err: any) {
      lastErr = err;
    }
  }

  if (!waUrl) {
    profilePicSyncCache.set(cacheKey, Date.now());
    logger.info({ jid: remoteJid, jidsToTry, err: lastErr?.message }, 'Foto de perfil indisponivel');
    return;
  }

  logger.info({ jid: remoteJid, waUrl: waUrl.substring(0, 80) }, 'URL da foto obtida, baixando...');

  // 2. Baixar a imagem
  let imageBuffer: Buffer;
  try {
    const response = await fetch(waUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } catch (err: any) {
    logger.warn({ jid: remoteJid, err: err?.message }, 'Erro ao baixar foto de perfil');
    return;
  }

  // 3. Subir para o Supabase Storage (bucket `avatars`)
  const fileKey = `whatsapp/${tenantId}/${profileId}.jpg`;
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(fileKey, imageBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadErr) {
    logger.debug({ jid: remoteJid, err: uploadErr.message }, 'Erro ao subir foto para Storage');
    return;
  }

  // 4. Obter URL pública e adicionar cache-buster timestamp
  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileKey);
  const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  // 5. Atualizar whatsapp_contacts e profiles
  await supabase
    .from('whatsapp_contacts')
    .update({ profile_pic_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('remote_jid', remoteJid);

  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', profileId);

  profilePicSyncCache.set(cacheKey, Date.now());
  logger.info({ jid: remoteJid, profileId }, 'Foto de perfil sincronizada com sucesso');
}

// Sincronização em massa: percorre todos os contatos do tenant e sincroniza fotos.
// Roda em background ao conectar a sessão. Limite e throttle protegem o WhatsApp.
async function bulkSyncProfilePictures(sock: WASocket, tenantId: string): Promise<void> {
  const { data: contacts, error } = await supabase
    .from('whatsapp_contacts')
    .select('profile_id, remote_jid, profile_pic_url, updated_at')
    .eq('tenant_id', tenantId)
    .eq('is_group', false)
    .not('profile_id', 'is', null)
    .not('remote_jid', 'is', null)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(150);

  if (error || !contacts || contacts.length === 0) {
    if (error) logger.debug({ err: error.message }, 'Erro ao listar contatos para bulk sync');
    return;
  }

  logger.info({ tenantId, total: contacts.length }, 'Iniciando bulk sync de fotos de perfil');

  let synced = 0;
  for (const contact of contacts) {
    if (!contact.profile_id || !contact.remote_jid) continue;
    try {
      await syncProfilePicture(sock, tenantId, contact.profile_id, contact.remote_jid);
      synced++;
    } catch (err: any) {
      logger.debug({ jid: contact.remote_jid, err: err?.message }, 'Erro no item do bulk sync');
    }
    // Throttle: ~300ms entre requisições para não disparar rate-limit do WhatsApp
    await new Promise((r) => setTimeout(r, 300));
  }

  logger.info({ tenantId, synced, total: contacts.length }, 'Bulk sync de fotos concluido');
}

type ProfilePicStatus = 'pending' | 'syncing' | 'synced' | 'unavailable' | 'failed' | 'skipped';

type SafeProfilePicJob = {
  sock: WASocket;
  session: SessionRecord;
  profileId: string;
  remoteJid: string;
  phone?: string | null;
};

type SafeProfilePicResult = {
  status: Extract<ProfilePicStatus, 'synced' | 'unavailable' | 'failed' | 'skipped'>;
  publicUrl?: string;
  error?: string | null;
};

const SAFE_PROFILE_PIC_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SAFE_PROFILE_PIC_ATTEMPT_TTL_MS = 24 * 60 * 60 * 1000;
const SAFE_PROFILE_PIC_TIMEOUT_MS = 5_000;
const SAFE_PROFILE_PIC_JOB_DELAY_MS = 2_500;
const SAFE_PROFILE_PIC_CIRCUIT_BREAK_MS = 5 * 60 * 1000;
const SAFE_PROFILE_PIC_MAX_CONSECUTIVE_FAILURES = 5;
const safeProfilePicQueue: SafeProfilePicJob[] = [];
const safeProfilePicQueued = new Set<string>();
const safeProfilePicCache = new Map<string, number>();
let safeProfilePicWorkerRunning = false;
let safeProfilePicCircuitOpenUntil = 0;
let safeProfilePicConsecutiveFailures = 0;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeProfilePicKey(tenantId: string, profileId: string) {
  return `${tenantId}:${profileId}`;
}

function safeProfilePicJids(remoteJid: string, phone?: string | null) {
  const jids: string[] = [];
  const normalizedPhone = normalizePhone(phone || '');
  if (normalizedPhone.startsWith('55') && normalizedPhone.length >= 12 && normalizedPhone.length <= 13) {
    jids.push(`${normalizedPhone}@s.whatsapp.net`);
  }
  if (remoteJid && !jids.includes(remoteJid)) {
    jids.push(remoteJid);
  }
  return jids;
}

async function updateSafeProfilePicState(
  tenantId: string,
  profileId: string,
  patch: Record<string, any>,
) {
  const { error } = await supabase
    .from('whatsapp_contacts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('profile_id', profileId);

  if (error) {
    logger.debug({ tenantId, profileId, err: error.message }, 'Erro ao atualizar estado da foto do contato');
  }
}

async function bumpSafeProfilePicAttempt(
  tenantId: string,
  profileId: string,
  status: Extract<ProfilePicStatus, 'unavailable' | 'failed'>,
  error?: string | null,
) {
  const { data: current } = await supabase
    .from('whatsapp_contacts')
    .select('profile_pic_attempts')
    .eq('tenant_id', tenantId)
    .eq('profile_id', profileId)
    .limit(1)
    .maybeSingle();

  await updateSafeProfilePicState(tenantId, profileId, {
    profile_pic_status: status,
    profile_pic_error: error || null,
    profile_pic_attempts: Number(current?.profile_pic_attempts || 0) + 1,
  });
}

async function safeSyncProfilePicture(job: SafeProfilePicJob): Promise<SafeProfilePicResult> {
  const cacheKey = safeProfilePicKey(job.session.tenant_id, job.profileId);
  const lastSync = safeProfilePicCache.get(cacheKey);
  if (lastSync && Date.now() - lastSync < SAFE_PROFILE_PIC_CACHE_TTL_MS) {
    return { status: 'skipped', error: 'Foto ja verificada recentemente' };
  }

  const jids = safeProfilePicJids(job.remoteJid, job.phone);
  if (jids.length === 0) {
    return { status: 'failed', error: 'Contato sem JID/telefone para foto' };
  }

  let waUrl: string | null = null;
  let lastError: any = null;
  for (const jid of jids) {
    try {
      waUrl = await Promise.race<string | null>([
        (job.sock as any).profilePictureUrl(jid, 'preview'),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('profilePictureUrl timeout 5s')), SAFE_PROFILE_PIC_TIMEOUT_MS)),
      ]);
      if (waUrl) break;
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!waUrl) {
    safeProfilePicCache.set(cacheKey, Date.now());
    return { status: 'unavailable', error: lastError?.message || 'Foto indisponivel no WhatsApp' };
  }

  try {
    const response = await fetch(waUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileKey = `whatsapp/${job.session.tenant_id}/${job.profileId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileKey, buffer, { contentType: 'image/jpeg', cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileKey);
    const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    await updateSafeProfilePicState(job.session.tenant_id, job.profileId, {
      profile_pic_url: publicUrl,
      profile_pic_status: 'synced',
      profile_pic_last_success_at: new Date().toISOString(),
      profile_pic_error: null,
    });

    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', job.profileId)
      .eq('tenant_id', job.session.tenant_id);

    safeProfilePicCache.set(cacheKey, Date.now());
    logger.info({ profileId: job.profileId, remoteJid: job.remoteJid }, 'Foto de perfil sincronizada pela fila segura');
    return { status: 'synced', publicUrl, error: null };
  } catch (err: any) {
    return { status: 'failed', error: err?.message || 'Erro ao sincronizar foto' };
  }
}

async function shouldRunSafeProfilePicJob(job: SafeProfilePicJob) {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select('profile_pic_url, profile_pic_status, profile_pic_last_attempt_at, profile_pic_attempts, is_group')
    .eq('tenant_id', job.session.tenant_id)
    .eq('profile_id', job.profileId)
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.debug({ profileId: job.profileId, err: error.message }, 'Erro ao verificar estado da foto');
    return false;
  }

  if (!data || data.is_group) return false;
  if (data.profile_pic_url && data.profile_pic_status === 'synced') return false;
  if (data.profile_pic_status === 'syncing') {
    if (!data.profile_pic_last_attempt_at) return false;
    const lastAttempt = new Date(data.profile_pic_last_attempt_at).getTime();
    if (Date.now() - lastAttempt < 10 * 60 * 1000) return false;
  }
  if (data.profile_pic_last_attempt_at) {
    const lastAttempt = new Date(data.profile_pic_last_attempt_at).getTime();
    const tooRecent = Date.now() - lastAttempt < SAFE_PROFILE_PIC_ATTEMPT_TTL_MS;
    if (tooRecent && ['unavailable', 'failed'].includes(data.profile_pic_status)) return false;
  }
  if (data.profile_pic_status === 'failed' && Number(data.profile_pic_attempts || 0) >= 3) return false;

  return true;
}

function enqueueSafeProfilePictureSync(job: SafeProfilePicJob) {
  if (!job.profileId || !job.remoteJid) return;
  if (job.remoteJid.endsWith('@g.us') || job.remoteJid.endsWith('@broadcast') || job.remoteJid.endsWith('@newsletter')) return;

  const key = safeProfilePicKey(job.session.tenant_id, job.profileId);
  const lastSync = safeProfilePicCache.get(key);
  if (lastSync && Date.now() - lastSync < SAFE_PROFILE_PIC_CACHE_TTL_MS) return;
  if (safeProfilePicQueued.has(key)) return;

  safeProfilePicQueued.add(key);
  safeProfilePicQueue.push(job);
  void runSafeProfilePicWorker();
}

async function enqueueRecentMissingProfilePictures(sock: WASocket, session: SessionRecord, limit = 5) {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select('profile_id, remote_jid, remote_jid_alt, phone_number')
    .eq('tenant_id', session.tenant_id)
    .eq('is_group', false)
    .not('profile_id', 'is', null)
    .or('profile_pic_url.is.null,profile_pic_status.eq.pending')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    logger.debug({ err: error.message }, 'Erro ao listar contatos para backfill seguro de fotos');
    return;
  }

  for (const contact of data || []) {
    const profileId = contact.profile_id as string | null;
    const remoteJid = (contact.remote_jid_alt || contact.remote_jid) as string | null;
    if (!profileId || !remoteJid) continue;
    enqueueSafeProfilePictureSync({
      sock,
      session,
      profileId,
      remoteJid,
      phone: contact.phone_number,
    });
  }

  if ((data || []).length > 0) {
    logger.info({ tenant: session.tenant_id, count: data?.length || 0 }, 'Backfill seguro de fotos enfileirado');
  }
}

function startSafeProfilePicBackfill(sessionKey: string, sock: WASocket, session: SessionRecord) {
  stopProfilePicBackfill(sessionKey);

  setTimeout(() => {
    if (activeSockets.get(sessionKey) === sock) {
      void enqueueRecentMissingProfilePictures(sock, session, 5);
    }
  }, 15_000);

  const timer = setInterval(() => {
    if (activeSockets.get(sessionKey) !== sock) {
      stopProfilePicBackfill(sessionKey);
      return;
    }
    void enqueueRecentMissingProfilePictures(sock, session, 3);
  }, 10 * 60 * 1000);

  profilePicBackfillTimers.set(sessionKey, timer);
}

async function runSafeProfilePicWorker() {
  if (safeProfilePicWorkerRunning) return;
  safeProfilePicWorkerRunning = true;

  try {
    while (safeProfilePicQueue.length > 0) {
      if (Date.now() < safeProfilePicCircuitOpenUntil) {
        await wait(Math.min(safeProfilePicCircuitOpenUntil - Date.now(), SAFE_PROFILE_PIC_CIRCUIT_BREAK_MS));
      }

      const job = safeProfilePicQueue.shift()!;
      const key = safeProfilePicKey(job.session.tenant_id, job.profileId);
      safeProfilePicQueued.delete(key);

      if (!(await shouldRunSafeProfilePicJob(job))) continue;

      await updateSafeProfilePicState(job.session.tenant_id, job.profileId, {
        profile_pic_status: 'syncing',
        profile_pic_last_attempt_at: new Date().toISOString(),
        profile_pic_error: null,
      });

      const result = await safeSyncProfilePicture(job);
      if (result.status === 'synced' || result.status === 'skipped') {
        safeProfilePicConsecutiveFailures = 0;
      } else if (result.status === 'unavailable') {
        safeProfilePicConsecutiveFailures = 0;
        await bumpSafeProfilePicAttempt(job.session.tenant_id, job.profileId, 'unavailable', result.error);
      } else {
        safeProfilePicConsecutiveFailures += 1;
        await bumpSafeProfilePicAttempt(job.session.tenant_id, job.profileId, 'failed', result.error);

        if (safeProfilePicConsecutiveFailures >= SAFE_PROFILE_PIC_MAX_CONSECUTIVE_FAILURES) {
          safeProfilePicCircuitOpenUntil = Date.now() + SAFE_PROFILE_PIC_CIRCUIT_BREAK_MS;
          safeProfilePicConsecutiveFailures = 0;
          logger.warn({ pausedUntil: new Date(safeProfilePicCircuitOpenUntil).toISOString() }, 'Circuit breaker de fotos de perfil ativado');
        }
      }

      await wait(SAFE_PROFILE_PIC_JOB_DELAY_MS);
    }
  } finally {
    safeProfilePicWorkerRunning = false;
  }
}

const pendingParticipantProfiles = new Map<string, Promise<string>>();

async function findOrCreateParticipantProfile(
  session: SessionRecord,
  participantJid: string,
  pushName?: string | null
): Promise<string> {
  const phone = normalizePhone(participantJid);
  const lockKey = `${session.tenant_id}:participant:${phone}`;

  if (pendingParticipantProfiles.has(lockKey)) {
    return pendingParticipantProfiles.get(lockKey)!;
  }

  const promise = (async () => {
    // 1. Check if profile exists by phone
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('tenant_id', session.tenant_id)
      .eq('phone', phone)
      .maybeSingle();

    if (profileLookupError) throw profileLookupError;
    if (existingProfile?.id) return existingProfile.id;

    // 1.5 Check if profile exists via whatsapp_contacts remote_jid_alt (LID migration)
    if (participantJid.endsWith('@lid')) {
      const { data: altContact } = await supabase
        .from('whatsapp_contacts')
        .select('profile_id')
        .eq('tenant_id', session.tenant_id)
        .eq('remote_jid_alt', participantJid)
        .maybeSingle();
      if (altContact?.profile_id) {
        await supabase
          .from('profiles')
          .update({ phone })
          .eq('id', altContact.profile_id);
        return altContact.profile_id;
      }
    }

    // 2. Check if profile exists by synthetic email
    const displayName = resolveWhatsappDisplayName(pushName, null, phone);
    const syntheticEmail = `${phone}@estateia.com`;

    const { data: profileByEmail, error: emailLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('tenant_id', session.tenant_id)
      .eq('email', syntheticEmail)
      .maybeSingle();

    if (emailLookupError) throw emailLookupError;
    if (profileByEmail?.id) return profileByEmail.id;

    // 3. Create auth user
    const password = randomUUID();
    logger.info({ phone, displayName }, 'Criando usuario de auth para o participante do grupo...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName }
    });

    let profileId: string;
    if (userError) {
      const isEmailExists = (userError as any)?.code === 'email_exists'
        || (userError as any)?.status === 422
        || userError.message?.toLowerCase().includes('already been registered');

      if (!isEmailExists) {
        logger.error({ error: userError, phone }, 'Erro ao criar usuario de auth para participante');
        throw userError;
      }

      const existingUser = await findAuthUserByEmail(syntheticEmail);
      if (!existingUser) throw userError;
      profileId = existingUser.id;
    } else {
      profileId = userData.user.id;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Ensure profile row exists
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .maybeSingle();

    if (!profileRow) {
      const { error: profileInsertError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          tenant_id: session.tenant_id,
          full_name: displayName,
          phone,
          role: 'client',
          is_group: false,
        });
      if (profileInsertError) throw profileInsertError;
    } else {
      await supabase
        .from('profiles')
        .update({
          tenant_id: session.tenant_id,
          full_name: displayName,
          phone,
          role: 'client',
          is_group: false,
        })
        .eq('id', profileId);
    }

    // 5. Ensure whatsapp_contacts row exists
    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select('id')
      .eq('tenant_id', session.tenant_id)
      .eq('phone_number', phone)
      .maybeSingle();

    if (!existingContact) {
      await supabase
        .from('whatsapp_contacts')
        .insert({
          tenant_id: session.tenant_id,
          profile_id: profileId,
          remote_jid: participantJid,
          phone_number: phone,
          name: displayName,
          is_group: false,
        });
    }

    return profileId;
  })();

  pendingParticipantProfiles.set(lockKey, promise);
  try {
    const result = await promise;
    return result;
  } finally {
    setTimeout(() => {
      pendingParticipantProfiles.delete(lockKey);
    }, 5000);
  }
}

async function ensureGroupParticipant(
  groupId: string,
  participantProfileId: string,
  role = 'member'
) {
  try {
    const { error } = await supabase
      .from('group_participants')
      .upsert({
        group_id: groupId,
        profile_id: participantProfileId,
        role,
      }, { onConflict: 'group_id,profile_id' });

    if (error) {
      logger.warn({ error: error.message, groupId, participantProfileId }, 'Erro ao inserir group_participants');
    }
  } catch (err: any) {
    logger.warn({ err: err.message, groupId, participantProfileId }, 'Erro no helper ensureGroupParticipant');
  }
}

const pendingConversations = new Map<string, Promise<{ profileId: string; conversationId: string | null | undefined; phone: string }>>();

async function findOrCreateWhatsappConversation(
  session: SessionRecord,
  remoteJid: string,
  pushName?: string | null,
  realPhone?: string | null,
  isFromMe?: boolean,
  sock?: WASocket
): Promise<{ profileId: string; conversationId: string | null | undefined; phone: string }> {
  const phone = realPhone || normalizePhone(remoteJid);
  const lockKey = `${session.tenant_id}:${phone}`;

  if (pendingConversations.has(lockKey)) {
    logger.info({ lockKey }, 'Aguardando criação de conversa concorrente já em andamento...');
    return pendingConversations.get(lockKey)!;
  }

  const promise = (async () => {
    // 1. Check if the contact already exists by phone_number, remote_jid OR remote_jid_alt
    // (canonical lookup: o mesmo contato pode chegar com @lid e @s.whatsapp.net em momentos diferentes)
    const { data: existingContact, error: contactError } = await supabase
      .from('whatsapp_contacts')
      .select('id, profile_id, conversation_id, phone_number, name, remote_jid, remote_jid_alt')
      .eq('tenant_id', session.tenant_id)
      .or(`phone_number.eq.${phone},remote_jid.eq.${remoteJid},remote_jid_alt.eq.${remoteJid}`)
      .maybeSingle();

    if (contactError) throw contactError;

    let phoneToStore = phone;
    // Anti-overwrite protection: do not let a LID fallback (15-digit Starting with 18...) overwrite a correct phone number!
    if (existingContact?.phone_number && existingContact.phone_number !== phone) {
      const isCurrentLid = phone.length === 15 && phone.startsWith('18');
      if (isCurrentLid || (existingContact.phone_number.startsWith('55') && !phone.startsWith('55'))) {
        phoneToStore = existingContact.phone_number;
      }
    }

    let displayName = resolveWhatsappDisplayName(pushName, existingContact?.name, phoneToStore);
    if (remoteJid.endsWith('@g.us')) {
      let groupName = 'Grupo WhatsApp';
      if (existingContact?.name) {
        groupName = existingContact.name;
      } else if (sock) {
        try {
          const metadata = await sock.groupMetadata(remoteJid);
          if (metadata && metadata.subject) {
            groupName = metadata.subject;
          }
        } catch (err: any) {
          logger.warn({ err: err.message, remoteJid }, 'Erro ao obter metadados do grupo, usando fallback');
        }
      }
      displayName = groupName;
    }
    const syntheticEmail = `${phoneToStore}@estateia.com`;

    let profileId = existingContact?.profile_id as string | null | undefined;
    let conversationId = existingContact?.conversation_id as string | null | undefined;
    let currentProfileName: string | null | undefined;

    if (!profileId) {
      const { data: profileByPhone, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', session.tenant_id)
        .eq('phone', phoneToStore)
        .maybeSingle();

      if (profileLookupError) throw profileLookupError;
      profileId = profileByPhone?.id;
    }

    if (!profileId) {
      const { data: profileByEmail, error: profileEmailLookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', session.tenant_id)
        .eq('email', syntheticEmail)
        .maybeSingle();

      if (profileEmailLookupError) throw profileEmailLookupError;
      profileId = profileByEmail?.id;
    }

    if (!profileId) {
      // 1. Create a dummy user in auth.users using the admin auth API to satisfy the profiles_id_fkey constraint
      const password = randomUUID();
      
      logger.info({ phone: phoneToStore }, 'Criando usuario de auth para o cliente...');
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: syntheticEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName }
      });

      if (userError) {
        const isEmailExists = (userError as any)?.code === 'email_exists'
          || (userError as any)?.status === 422
          || userError.message?.toLowerCase().includes('already been registered');

        if (!isEmailExists) {
          logger.error({ error: userError, phone: phoneToStore }, 'Erro ao criar usuario de auth para o cliente');
          throw userError;
        }

        logger.warn({ phone: phoneToStore, email: syntheticEmail }, 'Usuario de auth ja existia; reaproveitando cadastro');
        const existingUser = await findAuthUserByEmail(syntheticEmail);
        if (!existingUser) {
          logger.error({ phone: phoneToStore, email: syntheticEmail }, 'Auth informou email existente, mas usuario nao foi encontrado');
          throw userError;
        }
        profileId = existingUser.id;
      } else {
        profileId = userData.user.id;
      }
      
      // 2. Wait 500ms to let any triggers run, then check if profile exists
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', profileId)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: profileId,
            tenant_id: session.tenant_id,
            full_name: displayName,
            phone: phoneToStore,
            role: 'client',
            is_group: remoteJid.endsWith('@g.us'),
          });

        if (profileInsertError) throw profileInsertError;
      } else {
        currentProfileName = existingProfile.full_name;
        const profileNamePatch = isWeakWhatsappName(currentProfileName, phoneToStore)
          ? { full_name: displayName }
          : {};
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            tenant_id: session.tenant_id,
            ...profileNamePatch,
            phone: phoneToStore,
            role: 'client',
            is_group: remoteJid.endsWith('@g.us'),
          })
          .eq('id', profileId);

        if (profileUpdateError) throw profileUpdateError;
      }
    }

    if (!conversationId) {
      const { data: existingConversation, error: conversationLookupError } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', session.tenant_id)
        .eq('client_id', profileId)
        .neq('status', 'closed')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (conversationLookupError) throw conversationLookupError;
      conversationId = existingConversation?.id;
    }

    if (!conversationId) {
      // Nova conversa entra como 'pending' (sem agente atribuido)
      // Mensagens enviadas pelo proprio admin (fromMe=true) entram direto como 'open' + agent atribuido
      const initialStatus = isFromMe ? 'open' : 'pending';
      const initialAgent = isFromMe ? (session.user_id || null) : null;
      const initialUnread = isFromMe ? 0 : 1;

      const conversationPayload: any = {
        tenant_id: session.tenant_id,
        client_id: profileId,
        agent_id: initialAgent,
        subject: `WhatsApp - ${displayName}`,
        status: initialStatus,
        unread_count: initialUnread,
        last_message_at: new Date().toISOString(),
      };

      let { data: conversation, error: conversationInsertError } = await supabase
        .from('conversations')
        .insert(conversationPayload)
        .select('id')
        .single();

      if (conversationInsertError?.message?.includes("'unread_count' column")) {
        delete conversationPayload.unread_count;
        const fallback = await supabase
          .from('conversations')
          .insert(conversationPayload)
          .select('id')
          .single();
        conversation = fallback.data;
        conversationInsertError = fallback.error;
      }

      if (conversationInsertError) throw conversationInsertError;
      if (!conversation) {
        throw new Error('Conversa nao retornada apos insert');
      }
      conversationId = conversation.id;
    } else if (!isFromMe) {
      // Conversa existente recebendo mensagem do cliente: incrementa unread_count
      const { error: rpcErr } = await supabase.rpc('increment_conversation_unread', { p_conversation_id: conversationId });
      if (rpcErr) {
        // Fallback se RPC nao existir ainda: raw update
        const { data: curr } = await supabase
          .from('conversations')
          .select('unread_count')
          .eq('id', conversationId!)
          .maybeSingle();
        await supabase
          .from('conversations')
          .update({ unread_count: ((curr as any)?.unread_count || 0) + 1, updated_at: new Date().toISOString() })
          .eq('id', conversationId!);
      }
    }

    if (existingContact) {
      // Se a mensagem for enviada por mim (fromMe = true), evitamos sobrescrever o nome cadastrado
      // do destinatário usando o pushName do remetente (admin).
      const finalName = isFromMe ? (existingContact.name || displayName) : displayName;

      // Canonicalizar JIDs: se o remoteJid atual difere do salvo, guardar no remote_jid_alt
      const updates: any = {
        phone_number: phoneToStore,
        name: finalName,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (existingContact.remote_jid && existingContact.remote_jid !== remoteJid && !existingContact.remote_jid_alt) {
        updates.remote_jid_alt = remoteJid;
      } else if (!existingContact.remote_jid && remoteJid) {
        updates.remote_jid = remoteJid;
      }

      const { error: updateError } = await supabase
        .from('whatsapp_contacts')
        .update(updates)
        .eq('id', existingContact.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('whatsapp_contacts')
        .insert({
          tenant_id: session.tenant_id,
          profile_id: profileId,
          conversation_id: conversationId,
          remote_jid: remoteJid,
          phone_number: phoneToStore,
          name: displayName,
          profile_pic_status: 'pending',
          is_group: remoteJid.endsWith('@g.us'),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      if (insertError) throw insertError;
    }

    const safeProfileName = cleanWhatsappName(displayName);
    if (profileId && safeProfileName) {
      const { data: profileNameRow, error: profileNameError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', profileId)
        .maybeSingle();

      if (profileNameError) throw profileNameError;
      if (isWeakWhatsappName(profileNameRow?.full_name, phoneToStore)) {
        await supabase
          .from('profiles')
          .update({ full_name: safeProfileName, updated_at: new Date().toISOString() })
          .eq('id', profileId)
          .eq('tenant_id', session.tenant_id);
      }
    }

    if (!isFromMe && phoneToStore.startsWith('55') && !remoteJid.endsWith('@g.us')) {
      await supabase
        .from('profiles')
        .update({ phone: phoneToStore, updated_at: new Date().toISOString() })
        .eq('id', profileId)
        .eq('tenant_id', session.tenant_id);
    }

    if (!isFromMe && conversationId && !remoteJid.endsWith('@g.us')) {
      try {
        const leadId = await ensureWhatsappLead({
          tenantId: session.tenant_id,
          phone: phoneToStore,
          name: displayName,
          profileId,
          conversationId,
          createdBy: session.user_id || null,
        });
        if (leadId) {
          logger.info({ leadId, phone: phoneToStore, conversationId }, 'Lead WhatsApp garantido para dashboard');
        }
      } catch (err: any) {
        logger.error(
          { err: err?.message || err, phone: phoneToStore, conversationId },
          'Falha ao garantir lead WhatsApp; mensagem sera mantida mesmo assim',
        );
      }
    }

    // Sincronizacao de foto via profilePictureUrl DESATIVADA por bloquear o socket Baileys.
    // (USync timeouts saturam o pipeline, impedindo recepcao de mensagens.)
    // Fotos sao sincronizadas via evento `contacts.upsert/update` quando WhatsApp envia espontaneamente.
    void sock; void profileId; // keep params used

    return { profileId, conversationId, phone: phoneToStore };
  })();

  pendingConversations.set(lockKey, promise);

  try {
    const result = await promise;
    return result;
  } catch (err) {
    pendingConversations.delete(lockKey);
    throw err;
  } finally {
    // Mantém o lock em memória por 5 segundos para que todas as mensagens concorrentes
    // do mesmo tick/rajada compartilhem o mesmo resultado
    setTimeout(() => {
      pendingConversations.delete(lockKey);
    }, 5000);
  }
}

// Retry tracking per session
const retryCounters = new Map<string, { count: number; lastQr?: number }>();

function getRetryCounter(key: string) {
  if (!retryCounters.has(key)) {
    retryCounters.set(key, { count: 0 });
  }
  return retryCounters.get(key)!;
}

function resetRetryCounter(key: string) {
  retryCounters.set(key, { count: 0 });
}

export async function startSession(session: SessionRecord) {
  const sessionKey = `${session.tenant_id}:${session.session_name}`;
  startingSessions.add(sessionKey);
  const counter = getRetryCounter(sessionKey);

  // Disconnect existing if any
  if (activeSockets.has(sessionKey)) {
    const old = activeSockets.get(sessionKey)!;
    activeSockets.delete(sessionKey);
    try { old.end(undefined); } catch { /* ignore */ }
  }

  const authDir = path.resolve(`./auth_info/${session.tenant_id}/${session.session_name}`);
  await mkdir(authDir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();
  const socketLogger = pino({ level: 'warn' });

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, socketLogger),
    },
    printQRInTerminal: false,
    logger: socketLogger,
    browser: Browsers.macOS('Chrome'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    defaultQueryTimeoutMs: 45_000,
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 15_000,
    mobile: false,
  });

  activeSockets.set(sessionKey, sock);

  const pairingPhone = normalizePairingPhone(session.phone_number);
  if (pairingPhone && !state.creds.registered) {
    setTimeout(async () => {
      try {
        const activeSock = activeSockets.get(sessionKey) as any;
        if (!activeSock || activeSock !== sock) return;
        const code = await activeSock.requestPairingCode(pairingPhone);
        const formattedCode = typeof code === 'string'
          ? code.match(/.{1,4}/g)?.join('-') || code
          : String(code || '');

        logger.info({ tenant: session.tenant_id, pairingPhone }, 'Codigo de pareamento WhatsApp gerado');
        await supabase
          .from('whatsapp_sessions')
          .update({
            status: 'qr_ready',
            pairing_code: formattedCode,
            qr_expires_at: new Date(Date.now() + 120_000).toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.id);
        await updateBrokerHealth(session, { status: 'qr_ready', last_event_at: new Date().toISOString(), last_error: null });
      } catch (err: any) {
        logger.error({ err: err?.message, tenant: session.tenant_id, pairingPhone }, 'Erro ao gerar codigo de pareamento WhatsApp');
        await supabase
          .from('whatsapp_sessions')
          .update({
            status: 'error',
            last_error: `Erro ao gerar codigo de pareamento: ${err?.message || 'erro desconhecido'}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.id);
        await updateBrokerHealth(session, {
          status: 'error',
          last_error_at: new Date().toISOString(),
          last_error: err?.message || 'Erro ao gerar codigo de pareamento',
        });
      }
    }, 1500);
  }

  // QR code handler
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Debounce QR generation
      const now = Date.now();
      if (counter.lastQr && now - counter.lastQr < 3000) {
        return;
      }
      counter.lastQr = now;

      logger.info({ tenant: session.tenant_id }, 'QR code gerado');
      const qrBase64 = await QRCode.toDataURL(qr, {
        errorCorrectionLevel: 'M',
        margin: 4,
        scale: 10,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      await supabase
        .from('whatsapp_sessions')
        .update({
          status: 'qr_ready',
          qr_code: qrBase64,
          qr_expires_at: new Date(Date.now() + 120_000).toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);
      await updateBrokerHealth(session, { status: 'qr_ready', last_event_at: new Date().toISOString() });
    }

    if (connection === 'close') {
      // Intentional disconnect (stopSession was called)
      if (!activeSockets.has(sessionKey)) {
        startingSessions.delete(sessionKey);
        resetRetryCounter(sessionKey);
        logger.info({ tenant: session.tenant_id, sessionKey }, 'Desconexao intencional. Nao reconectando.');
        return;
      }

      const closeCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode || null;
      const closeMessage = (lastDisconnect?.error as Error | undefined)?.message || 'Conexao fechada';
      const isLoggedOut = closeCode === DisconnectReason.loggedOut;
      const isBadSession = closeCode === DisconnectReason.badSession;

      logger.info({ tenant: session.tenant_id, closeCode, isLoggedOut, closeMessage }, 'Conexao fechada');

      activeSockets.delete(sessionKey);
      stopProfilePicBackfill(sessionKey);
      startingSessions.delete(sessionKey);

      // Critical errors: stop
      if (closeCode === 405 || closeCode === DisconnectReason.multideviceMismatch) {
        const errorMsg = closeCode === 405
          ? '[405] WhatsApp recusou o handshake.'
          : '[multidevice] Sessao invalida.';
        await supabase.from('whatsapp_sessions').update({
          status: 'error', qr_code: null, qr_expires_at: null,
          last_error: errorMsg, updated_at: new Date().toISOString(),
        }).eq('id', session.id);
        await updateBrokerHealth(session, { status: 'error', last_error_at: new Date().toISOString(), last_error: errorMsg });
        resetRetryCounter(sessionKey);
        return;
      }

      // Logged out / bad session: clear auth and stop
      if (isLoggedOut || isBadSession) {
        try { await rm(authDir, { recursive: true, force: true }); } catch { /* ignore */ }
        await supabase.from('whatsapp_sessions').update({
          status: 'disconnected', qr_code: null, qr_expires_at: null,
          last_error: isLoggedOut ? 'Desconectado pelo usuario' : 'Sessao invalida',
          updated_at: new Date().toISOString(),
        }).eq('id', session.id);
        await updateBrokerHealth(session, {
          status: 'disconnected',
          last_error_at: new Date().toISOString(),
          last_error: isLoggedOut ? 'Desconectado pelo usuario' : 'Sessao invalida',
        });
        resetRetryCounter(sessionKey);
        return;
      }

      // Everything else: let the central polling system handle the reconnection by updating the DB status to 'connecting'
      counter.count += 1;
      if (counter.count >= 10) {
        await supabase.from('whatsapp_sessions').update({
          status: 'error', qr_code: null, qr_expires_at: null,
          last_error: 'Maximo de tentativas excedido. Desconecte e conecte novamente.',
          updated_at: new Date().toISOString(),
        }).eq('id', session.id);
        await updateBrokerHealth(session, {
          status: 'error',
          last_error_at: new Date().toISOString(),
          last_error: 'Maximo de tentativas excedido. Desconecte e conecte novamente.',
        });
        resetRetryCounter(sessionKey);
        return;
      }

      logger.info({ tenant: session.tenant_id, retry: counter.count }, 'Atualizando status para connecting para o poll loop reconectar de forma limpa');
      await supabase.from('whatsapp_sessions').update({
        status: 'connecting',
        qr_code: null,
        qr_expires_at: null,
        last_error: closeCode ? `[${closeCode}] ${closeMessage}` : closeMessage,
        updated_at: new Date().toISOString(),
      }).eq('id', session.id);
      await updateBrokerHealth(session, {
        status: 'connecting',
        last_error_at: new Date().toISOString(),
        last_error: closeCode ? `[${closeCode}] ${closeMessage}` : closeMessage,
      });
    }

    if (connection === 'open') {
      logger.info({ tenant: session.tenant_id }, 'Conexao aberta');
      startingSessions.delete(sessionKey);
      connectionTimestamps.set(sessionKey, Date.now());
      const user = sock.user;
      resetRetryCounter(sessionKey);
      await supabase
        .from('whatsapp_sessions')
        .update({
          status: 'connected',
          qr_code: null,
          qr_expires_at: null,
          phone_number: user?.id?.split(':')[0] || null,
          last_error: null,
          last_connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);
      await updateBrokerHealth(
        { ...session, phone_number: user?.id?.split(':')[0] || session.phone_number },
        { status: 'connected', last_success_at: new Date().toISOString(), last_error: null },
      );

      // Bulk sync de fotos DESATIVADO — saturava o socket Baileys com USync queries timeout
      // bloqueando recepcao de mensagens. Confiamos apenas em `contacts.upsert/update` events.
      void bulkSyncProfilePictures;
      startSafeProfilePicBackfill(sessionKey, sock, { ...session, phone_number: user?.id?.split(':')[0] || session.phone_number });
    }
  });

  // Save credentials
  sock.ev.on('creds.update', saveCreds);

  // Capturar fotos de perfil via evento de contatos (Baileys emite imgUrl quando WhatsApp sincroniza)
  const handleContactsEvent = async (contacts: any[]) => {
    for (const c of contacts) {
      try {
        if (!c?.id || !c?.imgUrl || typeof c.imgUrl !== 'string') continue;
        if (c.imgUrl === 'changed' || c.imgUrl.length < 10) continue; // 'changed' = sinal de mudança, não URL

        // Buscar o profile_id correspondente
        const { data: contactRow } = await supabase
          .from('whatsapp_contacts')
          .select('profile_id')
          .eq('tenant_id', session.tenant_id)
          .or(`remote_jid.eq.${c.id},phone_number.eq.${normalizePhone(c.id)}`)
          .maybeSingle();

        if (!contactRow?.profile_id) continue;

        // Baixar e subir para Storage
        try {
          const response = await fetch(c.imgUrl);
          if (!response.ok) continue;
          const buf = Buffer.from(await response.arrayBuffer());
          const fileKey = `whatsapp/${session.tenant_id}/${contactRow.profile_id}.jpg`;
          const { error: uploadErr } = await supabase.storage
            .from('avatars')
            .upload(fileKey, buf, { contentType: 'image/jpeg', cacheControl: '3600', upsert: true });
          if (uploadErr) continue;
          const { data: pub } = supabase.storage.from('avatars').getPublicUrl(fileKey);
          const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;
          await supabase.from('whatsapp_contacts')
            .update({
              profile_pic_url: publicUrl,
              profile_pic_status: 'synced',
              profile_pic_last_success_at: new Date().toISOString(),
              profile_pic_error: null,
              updated_at: new Date().toISOString(),
            })
            .eq('tenant_id', session.tenant_id).eq('remote_jid', c.id);
          await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', contactRow.profile_id);
          logger.info({ jid: c.id, profileId: contactRow.profile_id }, 'Foto de perfil sincronizada via contacts.update');
        } catch (err: any) {
          logger.debug({ jid: c.id, err: err?.message }, 'Erro ao processar foto via contacts.update');
        }
      } catch (err: any) {
        logger.debug({ err: err?.message }, 'Erro no handler contacts.update');
      }
    }
  };

  sock.ev.on('contacts.upsert', handleContactsEvent);
  sock.ev.on('contacts.update', handleContactsEvent);

  // Incoming and Outgoing messages handler (Syncs mobile app replies)
  logger.info({ sessionKey }, 'Registrando handler messages.upsert');
  sock.ev.on('messages.upsert', async (upsert: any) => {
    if (upsert.type !== 'notify') {
      logger.info({ type: upsert.type, count: upsert.messages?.length || 0, sessionKey }, 'messages.upsert tipo nao-notify recebido');
    }
    logger.info({ type: upsert.type, count: upsert.messages?.length || 0, sessionKey }, 'messages.upsert evento recebido');
    const connectedAt = connectionTimestamps.get(sessionKey) || 0;
    for (const msg of upsert.messages) {
      try {
      logger.info({ msgId: msg.key.id, jid: msg.key.remoteJid, fromMe: msg.key.fromMe, type: upsert.type, hasMessage: !!msg.message }, 'Processando mensagem');
      // Clonar a mensagem original intacta para uso no download de mídia
      const originalMsgClone = JSON.parse(JSON.stringify(msg));

      // Se msg.message estiver vazio, pode ser mensagem ainda nao descriptografada (ocorre em LIDs)
      if (!msg.message) {
        logger.warn({ msgId: msg.key.id, jid: msg.key.remoteJid }, 'msg.message ausente — possivelmente nao descriptografada ainda');
        continue;
      }

      // Desembrulhar mensagens protegidas/temporárias (ephemeral, viewOnce, document com legenda)
      if (msg.message) {
        let message: any = msg.message;
        if (message.ephemeralMessage) {
          message = message.ephemeralMessage.message;
        }
        if (message.viewOnceMessage) {
          message = message.viewOnceMessage.message;
        }
        if (message.viewOnceMessageV2) {
          message = message.viewOnceMessageV2.message;
        }
        if (message.documentWithCaptionMessage) {
          message = message.documentWithCaptionMessage.message;
        }
        if (message) {
          msg.message = message;
        }
      }

      const isFromMe = !!msg.key.fromMe;

      const msgTimestamp = msg.messageTimestamp;
      let msgTimestampSec = 0;
      if (typeof msgTimestamp === 'number') {
        msgTimestampSec = msgTimestamp;
      } else if (msgTimestamp && typeof msgTimestamp === 'object' && 'toNumber' in msgTimestamp) {
        msgTimestampSec = (msgTimestamp as any).toNumber();
      } else if (msgTimestamp) {
        msgTimestampSec = Number(msgTimestamp);
      }
      const msgTimestampMs = msgTimestampSec * 1000;

      // Apenas bloquear mensagens excessivamente antigas (mais de 24 horas atrás)
      // Removemos a trava do connectedAt porque ela causava descarte de mensagens recebidas durante as reconexões ou intermitências da rede.
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      if (msgTimestampMs < twentyFourHoursAgo) {
        logger.info({ jid: msg.key.remoteJid, msgId: msg.key.id, msgTime: msgTimestampMs }, 'Mensagem antiga (> 24h) ignorada');
        continue;
      }

      const remoteJid = msg.key.remoteJid!;
      logger.info({ msgId: msg.key.id, jid: remoteJid }, 'JID da mensagem');

      // Bloquear status, newsletters e broadcast lists.
      // Contatos (@s.whatsapp.net e @lid) e grupos (@g.us) devem passar.
      if (
        remoteJid.endsWith('@broadcast') ||
        remoteJid.endsWith('@newsletter') ||
        remoteJid === 'status@broadcast'
      ) {
        logger.info({ jid: remoteJid }, 'Ignorando broadcast/newsletter/status');
        continue;
      }
      
      const isGroup = remoteJid.endsWith('@g.us');

      // Só processamos JIDs reconhecidos como contatos pessoais ou grupos
      if (!remoteJid.endsWith('@s.whatsapp.net') && !remoteJid.endsWith('@lid') && !isGroup) {
        logger.info({ jid: remoteJid }, 'Ignorando JID nao reconhecido');
        continue;
      }

      const sessionPhone = session.phone_number ? normalizePhone(session.phone_number) : '';
      const remotePhone = normalizePhone(remoteJid);
      if (isFromMe && sessionPhone && remotePhone === sessionPhone) {
        logger.info({ jid: remoteJid, msgId: msg.key.id, sessionPhone }, 'Ignorando eco fromMe do proprio numero conectado');
        continue;
      }

      const whatsappMessageId = msg.key.id;
      const crmMessageType = getMessageType(msg);
      const crmMessageTableType = 'text';

      // Extract real phone if available from alternative JID fields (LID resolution)
      let realPhone: string | null = null;
      if (remoteJid.endsWith('@lid')) {
        const keyAny = msg.key as any;
        const msgAny = msg as any;
        const altJid = keyAny?.remoteJidAlt || keyAny?.senderPn || msgAny?.senderPn || msg.participant || keyAny?.participant;
        if (altJid && typeof altJid === 'string' && (altJid.endsWith('@s.whatsapp.net') || altJid.includes('@'))) {
          realPhone = normalizePhone(altJid);
        }
      }

      const canonicalJid = canonicalRemoteJid(remoteJid, realPhone);
      await updateBrokerHealth(session, { status: 'connected', last_event_at: new Date().toISOString() });

      const claim = await claimMessageProcessing({
        session,
        whatsappMessageId,
        remoteJid,
        canonicalJid,
        isFromMe,
        eventType: upsert.type,
        messageType: crmMessageType,
      });
      if (!claim.claimed) {
        logger.info({ msgId: whatsappMessageId, remoteJid }, 'Mensagem duplicada ignorada pelo processamento');
        continue;
      }

      if (whatsappMessageId) {
        const { count, error: existsError } = await supabase
          .from('whatsapp_messages')
          .select('id', { count: 'exact', head: true })
          .eq('whatsapp_session_id', session.id)
          .eq('whatsapp_message_id', whatsappMessageId);

        if (existsError) {
          logger.error({ err: existsError.message, msgId: whatsappMessageId }, 'Erro ao verificar duplicata, pulando mensagem');
          continue;
        }
        if ((count || 0) > 0) {
          logger.info({ msgId: whatsappMessageId }, 'Mensagem duplicada, pulando');
          await finishMessageProcessing(claim.id, 'ignored', 'none', 'Mensagem ja existia em whatsapp_messages');
          continue;
        }
      }

      let crmContent = getMessageContent(msg);
      
      let mediaData: any = null;
      let mediaStatus: 'none' | 'downloaded' | 'failed' = crmMessageType === 'text' || crmMessageType === 'location' ? 'none' : 'failed';
      if (crmMessageType !== 'text' && crmMessageType !== 'location') {
        const activeSock = getActiveSocket(session.tenant_id, session.session_name);
        if (activeSock) {
          logger.info({ msgId: msg.key.id, type: crmMessageType }, 'Baixando midia...');
          mediaData = await Promise.race([
            downloadAndUploadMedia(activeSock, originalMsgClone, crmMessageType),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Media download timeout 20s')), 20_000)),
          ]).catch((err) => {
            logger.error({ err: err?.message, msgId: msg.key.id }, 'Timeout/Erro ao baixar midia, prosseguindo sem midia');
            return null;
          });
          if (mediaData) {
            mediaStatus = 'downloaded';
            const label = crmMessageType === 'image' ? 'Imagem' :
                          crmMessageType === 'video' ? 'Video' :
                          crmMessageType === 'audio' ? 'Audio' : 'Arquivo';
            crmContent = `[${label}] ${mediaData.fileName}\n${mediaData.publicUrl}`;
          } else {
            crmContent = `[Midia indisponivel] ${crmMessageType}`;
          }
        }
      }

      logger.info({ msgId: msg.key.id, remoteJid, pushName: msg.pushName, realPhone, isFromMe }, 'Buscando/criando conversa...');
      const { profileId, conversationId } = await findOrCreateWhatsappConversation(session, remoteJid, msg.pushName, realPhone, isFromMe, sock);
      logger.info({ msgId: msg.key.id, profileId, conversationId }, 'Conversa encontrada/criada');
      if (!isFromMe) {
        enqueueSafeProfilePictureSync({
          sock,
          session,
          profileId,
          remoteJid,
          phone: realPhone,
        });
      }

      const { error: waMsgErr } = await supabase.from('whatsapp_messages').insert({
        tenant_id: session.tenant_id,
        whatsapp_session_id: session.id,
        conversation_id: conversationId,
        remote_jid: remoteJid,
        canonical_remote_jid: canonicalJid,
        from_me: isFromMe,
        message_type: crmMessageType,
        content: crmContent || null,
        media_url: mediaData?.publicUrl || null,
        media_mime_type: mediaData?.mimeType || null,
        media_file_name: mediaData?.fileName || null,
        media_size: mediaData?.size || null,
        whatsapp_message_id: whatsappMessageId,
        source_event_type: upsert.type,
        processing_status: 'processed',
        media_status: mediaStatus,
        status: 'delivered',
        created_at: new Date().toISOString(),
      });
      if (waMsgErr) {
        logger.error({ err: waMsgErr.message, msgId: whatsappMessageId, remoteJid }, 'Erro ao inserir whatsapp_messages');
        if ((waMsgErr as any).code === '23505' || waMsgErr.message?.includes('duplicate key')) {
          logger.info({ msgId: whatsappMessageId, conversationId }, 'Eco/duplicata do WhatsApp ja registrada; pulando insert em messages');
          await finishMessageProcessing(claim.id, 'ignored', mediaStatus, 'Duplicada em whatsapp_messages');
          continue;
        }
        await finishMessageProcessing(claim.id, 'failed', mediaStatus, waMsgErr.message);
        await updateBrokerHealth(session, { status: 'connected', last_error_at: new Date().toISOString(), last_error: waMsgErr.message });
        continue;
      } else {
        logger.info({ msgId: whatsappMessageId, conversationId }, 'whatsapp_messages inserida com sucesso');
      }

      let agentId = session.user_id || null;
      if (isFromMe && !agentId) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('agent_id')
          .eq('id', conversationId)
          .maybeSingle();
        if (conv?.agent_id) {
          agentId = conv.agent_id;
        } else {
          const { data: adminProf } = await supabase
            .from('profiles')
            .select('id')
            .eq('tenant_id', session.tenant_id)
            .in('role', ['admin', 'manager'])
            .limit(1)
            .maybeSingle();
          agentId = adminProf?.id || null;
        }
      }

      let senderProfileId = profileId; // default fallback (group profile)
      if (isGroup && !isFromMe) {
        const participantJid = msg.participant || msg.key.participant;
        if (participantJid) {
          try {
            // 1. Encontra ou cria o profile para o participante do grupo
            const participantProfileId = await findOrCreateParticipantProfile(session, participantJid, msg.pushName);
            senderProfileId = participantProfileId;
            // 2. Garante que o participante está vinculado ao grupo na tabela group_participants
            await ensureGroupParticipant(profileId, participantProfileId);
            
            // 3. Adiciona ele como lead com a tag "Grupo do WhatsApp"
            try {
              const participantPhone = normalizePhone(participantJid);
              const leadId = await ensureWhatsappLead({
                tenantId: session.tenant_id,
                phone: participantPhone,
                name: msg.pushName || `Cliente ${participantPhone.slice(-4)}`,
                profileId: participantProfileId,
                conversationId: conversationId,
                createdBy: session.user_id || null,
                tags: ['Grupo do WhatsApp']
              });
              if (leadId) {
                logger.info({ leadId, participantJid }, 'Lead garantido com tag de Grupo para o participante');
              }
            } catch (leadErr: any) {
              logger.error({ err: leadErr.message, participantJid }, 'Erro ao criar/atualizar lead para participante do grupo');
            }

          } catch (err: any) {
            logger.error({ err: err.message, participantJid }, 'Erro ao processar participante do grupo no messages.upsert');
          }
        }
      }

      const { error: msgErr } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: isFromMe ? (agentId || profileId) : senderProfileId,
        receiver_id: isGroup ? null : (isFromMe ? profileId : (agentId || null)),
        content: crmContent || '',
        message_type: crmMessageTableType,
        is_read: isFromMe ? true : false,
        created_at: new Date().toISOString(),
      });
      if (msgErr) {
        logger.error({ err: msgErr.message, msgId: whatsappMessageId }, 'Erro ao inserir messages');
        await finishMessageProcessing(claim.id, 'failed', mediaStatus, msgErr.message);
        await updateBrokerHealth(session, { status: 'connected', last_error_at: new Date().toISOString(), last_error: msgErr.message });
      } else {
        logger.info({ msgId: whatsappMessageId, conversationId }, 'messages inserida com sucesso');
        await finishMessageProcessing(claim.id, 'processed', mediaStatus, null);
        await updateBrokerHealth(session, { status: 'connected', last_success_at: new Date().toISOString(), last_error: null });
      }

      if (!isFromMe) {
        // Se a mensagem vem do cliente
        const { data: currentConv } = await supabase
          .from('conversations')
          .select('status, agent_id')
          .eq('id', conversationId)
          .maybeSingle();

        // Se estiver sem atendente (agent_id IS NULL) ou se a conversa estiver fechada (status = 'closed')
        // marcamos o status como 'waiting' (Em espera) para ir para "Não Lidas".
        if (!currentConv || !currentConv.agent_id || currentConv.status === 'closed') {
          await supabase
            .from('conversations')
            .update({ 
              status: 'pending',
              last_message_at: new Date().toISOString(), 
              updated_at: new Date().toISOString() 
            })
            .eq('id', conversationId);
        } else {
          // Se já tem atendente ativo, apenas atualizamos last_message_at
          await supabase
            .from('conversations')
            .update({ 
              last_message_at: new Date().toISOString(), 
              updated_at: new Date().toISOString() 
            })
            .eq('id', conversationId);
        }
      } else {
        // Se for mensagem de saida (enviada pelo celular pessoal pareado ou pelo CRM)
        // Task1 fix 'Nao Lidos': resposta do atendente limpa a rastreabilidade de nao lida.
        const { data: _outConv } = await supabase
          .from('conversations')
          .select('status')
          .eq('id', conversationId)
          .maybeSingle();
        const _outStatus = (_outConv?.status === 'pending') ? 'active' : (_outConv?.status || 'active');
        await supabase
          .from('conversations')
          .update({ 
            last_message_at: new Date().toISOString(), 
            updated_at: new Date().toISOString(),
            unread_count: 0,
            status: _outStatus
          })
          .eq('id', conversationId);
      }

      logger.info({ from: remoteJid, tenant: session.tenant_id, fromMe: isFromMe, msgId: msg.key.id }, 'Mensagem processada com sucesso');
      } catch (msgErr: any) {
        logger.error({ err: msgErr?.message, stack: msgErr?.stack, msgId: msg.key?.id, jid: msg.key?.remoteJid }, 'Erro ao processar mensagem individual');
      }
    }
  });

  // Log de decrypt retries para observabilidade
  sock.ev.on('messages.update', async (updates: any[]) => {
    for (const update of updates) {
      if (update.update?.message) {
        logger.info({ msgId: update.key.id, jid: update.key.remoteJid }, 'messages.update recebido (decrypt retry)');
      }
    }
  });

  // Observabilidade: chats.upsert indica que o WhatsApp está sincronizando conversas
  sock.ev.on('chats.upsert', async (chats: any[]) => {
    logger.info({ count: chats.length, sessionKey }, 'chats.upsert recebido');
  });

  // Observabilidade: presence indica que o socket está recebendo eventos do WhatsApp
  sock.ev.on('presence.update', async (update: any) => {
    logger.debug({ jid: update.id, presences: Object.keys(update.presences || {}), sessionKey }, 'presence.update');
  });
}

export async function stopSession(tenantId: string, sessionName: string, deleteAuth = false) {
  const sessionKey = `${tenantId}:${sessionName}`;
  startingSessions.delete(sessionKey);
  connectionTimestamps.delete(sessionKey);
  const sock = activeSockets.get(sessionKey);
  if (sock) {
    activeSockets.delete(sessionKey);
    try { sock.end(undefined); } catch { /* ignore */ }
  }
  if (deleteAuth) {
    const authDir = path.resolve(`./auth_info/${tenantId}/${sessionName}`);
    try {
      await rm(authDir, { recursive: true, force: true });
      logger.info({ tenant: tenantId, sessionName }, 'Credenciais de autenticação removidas com sucesso no stopSession');
    } catch (err) {
      logger.error({ err, tenant: tenantId, sessionName }, 'Erro ao remover credenciais no stopSession');
    }
  }
}

export async function sendMessage(tenantId: string, sessionName: string, phoneNumber: string, content: string) {
  const sessionKey = `${tenantId}:${sessionName}`;

  /**
   * HELPER DE RETRY RESILIENTE (backport do DEV 31/08/2026)
   * O envio de mídia/áudio via Baileys falha com UND_ERR_CONNECT_TIMEOUT e
   * "Bad MAC Error" quando o WebSocket cai momentaneamente.
   * Este helper tenta reenviar até MAX_TRIES, reconectando a sessão se preciso.
   */
  const MAX_TRIES = 3;
  const RETRY_DELAY_MS = 1200;

  const getSock = (key: string) => activeSockets.get(key);

  const reconnectSession = async (key: string): Promise<void> => {
    const sock = getSock(key);
    if (sock) { try { sock.end(undefined); } catch {} }
    activeSockets.delete(key);
    // small wait so the SDK can restart the websocket cleanly
    await new Promise(r => setTimeout(r, 400));
    try {
      // Fetch the canonical SessionRecord from DB to pass to startSession
      const { data: sessionRows } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('session_name', sessionName)
        .limit(1);
      const sessionRec = sessionRows && sessionRows.length > 0 ? sessionRows[0] : null;
      if (sessionRec) {
        await startSession(sessionRec as any);
      } else {
        logger.warn({ tenantId, sessionName }, 'Reconnect: sessão não encontrada no banco para religar');
      }
    } catch (e: any) {
      logger.warn({ err: e?.message }, 'Falha na reconexão da sessão durante retry');
    }
  };

  const withRetry = async (fn: () => Promise<any>): Promise<any> => {
    let lastErr: any;
    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
      const socket = getSock(sessionKey);
      if (!socket) {
        throw new Error('Sessão não encontrada ou não conectada');
      }
      try {
        const r = await fn();
        if (attempt > 1) {
          logger.info({ attempt }, 'Envio recuperado apos tentativas anteriores');
        }
        return r;
      } catch (err: any) {
        lastErr = err;
        const msg = err?.cause?.message || err?.message || String(err);
        const retryable = /CONNECT_TIMEOUT|UND_ERR|Bad MAC|fetch failed|ECONN|ETIMEDOUT|socket closed|connection/i.test(msg);
        if (retryable && attempt < MAX_TRIES) {
          logger.warn({ attempt, err: msg }, 'Falha transitória no envio, tentando novamente...');
          await reconnectSession(sessionKey);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        } else {
          break;
        }
      }
    }
    throw lastErr;
  };

  const sock = activeSockets.get(sessionKey);
  if (!sock) {
    throw new Error('Sessão não encontrada ou não conectada');
  }

  let jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;

  // Look up in database if there is a mapped remote_jid for this contact/phone_number to handle LIDs correctly
  if (!phoneNumber.includes('@')) {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const { data: contact } = await supabase
        .from('whatsapp_contacts')
        .select('remote_jid, remote_jid_alt, phone_number')
        .eq('tenant_id', tenantId)
        .eq('phone_number', cleanPhone)
        .maybeSingle();

      if (contact?.remote_jid_alt?.endsWith('@s.whatsapp.net')) {
        jid = contact.remote_jid_alt;
        logger.info({ phoneNumber, resolvedJid: jid }, 'PN/JID alternativo resolvido do banco de dados para envio');
      } else if (contact?.remote_jid?.endsWith('@s.whatsapp.net')) {
        jid = contact.remote_jid;
        logger.info({ phoneNumber, resolvedJid: jid }, 'LID/JID resolvido do banco de dados para envio');
      } else if (contact?.phone_number) {
        jid = `${contact.phone_number.replace(/\D/g, '')}@s.whatsapp.net`;
        logger.info({ phoneNumber, resolvedJid: jid }, 'Telefone do contato usado como PN para envio');
      }
    } catch (err) {
      logger.error({ err, phoneNumber }, 'Erro ao resolver remote_jid no sendMessage');
    }
  }

  // Parse potential media messages sent from the CRM
  const lines = content.split('\n');
  const urlLine = lines.find(line => line.trim().startsWith('http://') || line.trim().startsWith('https://'))?.trim();

  if (urlLine) {
    if (content.startsWith('[Imagem]')) {
      logger.info({ jid, url: urlLine }, 'Enviando imagem nativa via WhatsApp...');
      return await sock.sendMessage(jid, { image: { url: urlLine } });
    }
    if (content.startsWith('[Video]')) {
      logger.info({ jid, url: urlLine }, 'Enviando vídeo nativo via WhatsApp...');
      return await sock.sendMessage(jid, { video: { url: urlLine } });
    }
    if (content.startsWith('[Audio]')) {
      logger.info({ jid, url: urlLine }, 'Baixando e convertendo áudio para OGG Opus nativo do WhatsApp e CRM...');
      try {
        const response = await fetch(urlLine);
        if (!response.ok) throw new Error(`HTTP ${response.status} ao baixar áudio: ${urlLine}`);
        const rawBuffer = Buffer.from(await response.arrayBuffer());

        // Converte para OGG Opus via ffmpeg
        const oggBuffer = await convertBufferToWhatsAppAudio(rawBuffer);
        let waveform: number[] = [];
        try {
          waveform = generateWaveform(oggBuffer);
        } catch (wfErr) {
          logger.warn({ wfErr }, 'Aviso: Falha ao gerar waveform, usando padrão');
        }

        // Extrai conversation_id dinâmico da URL
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
        const sendPayload: any = {
          audio: oggBuffer,
          mimetype: 'audio/ogg; codecs=opus',
        };
        // CORREÇÃO DINÂMICA (Jarvis 02/09): quando o arquivo tem o marcador '_no_ptt_',
        // o envio é a REMODELAÇÃO do áudio (sem ptt nem waveform) — é o que destrava o
        // celular do destinatário quando o PTT aparece como 'indisponível'.
        // Envios NORMAIS (sem o marcador) continuam como voice message (ptt:true), igual antes.
        const isNoPtt = urlLine && (urlLine.includes('_no_ptt_') || urlLine.includes('_teste_'));
        if (isNoPtt) {
          logger.info({ jid, url: urlLine }, 'REENVIO CORRIGIDO SEM PTT/WAVEFORM (formato que destrava o celular do destinatario)');
        } else {
          sendPayload.ptt = true;
          if (waveform && waveform.length > 0) {
            sendPayload.waveform = Buffer.from(waveform);
          }
        }
        return await withRetry(() => sock.sendMessage(jid, sendPayload).then(res => { const id = res?.key?.id; if (id) logger.info({ jid, keyId: id }, 'Audio PTT enviado'); return res; }));

      } catch (err: any) {
        logger.error({ jid, url: urlLine, err: err?.message || err }, 'Falha na conversão de áudio, enviando raw fallback');
        const rawBuf = Buffer.from(await (await fetch(urlLine)).arrayBuffer());
        return await withRetry(() => sock.sendMessage(jid, { audio: rawBuf, mimetype: 'audio/ogg; codecs=opus', ptt: true }).then(res => { const id = res?.key?.id; if (id) logger.info({ jid, keyId: id }, 'Audio raw fallback enviado'); return res; }));
      }
    }
    if (content.startsWith('[Arquivo]')) {
      const fileName = content.replace(/\[Arquivo\]\s*/, '').split('\n')[0] || 'Arquivo';
      logger.info({ jid, url: urlLine, fileName }, 'Enviando documento nativo via WhatsApp...');
      return await withRetry(() => sock.sendMessage(jid, { document: { url: urlLine }, fileName, mimetype: 'application/octet-stream' }));
    }
  }

  const result = await withRetry(() => sock.sendMessage(jid, { text: content }));
  return result;
}

export function getActiveSocket(tenantId: string, sessionName: string): WASocket | undefined {
  return activeSockets.get(`${tenantId}:${sessionName}`);
}


/**
 * Converte um buffer de áudio (WEBM, MP3, WAV, etc.) para o formato oficial do WhatsApp
 * (OGG com codec Opus, mono 1 canal, 48kHz, VoIP profile).
 */
export async function convertBufferToWhatsAppAudio(inputBuffer: Buffer): Promise<Buffer> {
  const fsNative = await import('fs');
  const pathNative = await import('path');
  const osNative = await import('os');
  const { execSync } = await import('child_process');

  const tempInput = pathNative.join(osNative.tmpdir(), `wa_in_${Date.now()}_${Math.random().toString(36).substring(7)}.tmp`);
  const tempOutput = pathNative.join(osNative.tmpdir(), `wa_out_${Date.now()}_${Math.random().toString(36).substring(7)}.ogg`);
  fsNative.writeFileSync(tempInput, inputBuffer);

  try {
    execSync(`ffmpeg -y -i "${tempInput}" -c:a libopus -ac 1 -ar 48000 -b:a 32k -application voip -vbr on -vn "${tempOutput}"`);
    const outputBuffer = fsNative.readFileSync(tempOutput);
    try { fsNative.unlinkSync(tempInput); } catch {}
    try { fsNative.unlinkSync(tempOutput); } catch {}
    return outputBuffer;
  } catch (err) {
    try { fsNative.unlinkSync(tempInput); } catch {}
    try { fsNative.unlinkSync(tempOutput); } catch {}
    throw err;
  }
}

/**
 * Gera os 64 bytes de visualização de onda sonora (Waveform) para o player do WhatsApp
 */
export function generateWaveform(audioBuffer: Buffer): number[] {
  const waveform = new Array(64).fill(0);
  const chunkSize = Math.floor(audioBuffer.length / 64);
  if (chunkSize <= 0) return waveform;
  for (let i = 0; i < 64; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, audioBuffer.length);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j += 4) {
      sum += Math.abs(audioBuffer[j] || 0);
      count++;
    }
    const avg = count > 0 ? sum / count : 30;
    waveform[i] = Math.min(100, Math.max(10, Math.floor((avg / 255) * 100)));
  }
  return waveform;
}