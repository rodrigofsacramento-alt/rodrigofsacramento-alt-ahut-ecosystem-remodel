import { supabase } from './supabase.js';
import { pino } from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export function startSupabaseRealtimeSync() {
  logger.info('Iniciando espião (Realtime Subscription) para a tabela profiles...');

  const channel = supabase
    .channel('broker-profiles-changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles' },
      async (payload) => {
        const newProfile = payload.new;
        const oldProfile = payload.old;

        // Se o nome não mudou, ignorar
        if (newProfile.full_name === oldProfile.full_name) {
          return;
        }

        logger.info(`[Realtime Espião] Perfil ID ${newProfile.id} mudou de nome para "${newProfile.full_name}". Sincronizando com whatsapp_contacts...`);

        // Garante que a tabela whatsapp_contacts reflita essa mudança instantaneamente
        // caso o frontend tenha falhado em sincronizar.
        const { error } = await supabase
          .from('whatsapp_contacts')
          .update({ name: newProfile.full_name })
          .eq('profile_id', newProfile.id);

        if (error) {
          logger.error(`[Realtime Espião] Erro ao sincronizar whatsapp_contacts: ${error.message}`);
        } else {
          logger.info(`[Realtime Espião] Contato sincronizado com sucesso para: ${newProfile.full_name}`);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info('[Realtime Espião] Inscrito com sucesso no canal do Supabase!');
      }
    });

  return channel;
}