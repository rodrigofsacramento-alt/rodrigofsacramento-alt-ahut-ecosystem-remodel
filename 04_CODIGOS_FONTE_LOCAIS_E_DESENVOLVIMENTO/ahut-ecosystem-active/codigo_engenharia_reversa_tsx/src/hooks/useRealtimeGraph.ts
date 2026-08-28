import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────
export interface GraphEvent {
  type: 'node_insert' | 'node_update' | 'node_delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export type GraphEventHandler = (event: GraphEvent) => void;

// ── Tables to watch ────────────────────────────────────
const WATCHED_TABLES = [
  'leads', 'properties', 'proposals', 'contracts',
  'visits', 'conversations', 'notifications',
  'gestao_tasks', 'profiles',
];

/**
 * useRealtimeGraph
 * 
 * Assina Supabase Realtime (postgres_changes INSERT) nas tabelas
 * monitoradas e emite eventos para o canvas (NeuralBackground).
 * 
 * Uso:
 *   const { emitEvent } = useRealtimeGraph((event) => {
 *     console.log('Graph event:', event);
 *   });
 */
export function useRealtimeGraph(handler?: GraphEventHandler) {
  const handlerRef = useRef<GraphEventHandler | undefined>(handler);
  handlerRef.current = handler;

  const emitEvent = useCallback((event: GraphEvent) => {
    if (handlerRef.current) {
      handlerRef.current(event);
    }
  }, []);

  useEffect(() => {
    // Subscribe to all watched tables
    const channels = WATCHED_TABLES.map(tableName => {
      const channel = supabase
        .channel(`graph-${tableName}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: tableName,
          },
          (payload) => {
            const event: GraphEvent = {
              type: 'node_insert',
              table: tableName,
              data: payload.new as Record<string, unknown>,
              timestamp: Date.now(),
            };
            emitEvent(event);
          }
        )
        .subscribe();

      return channel;
    });

    // Cleanup: unsubscribe all channels
    return () => {
      for (const channel of channels) {
        supabase.removeChannel(channel);
      }
    };
  }, [emitEvent]);

  return { emitEvent };
}

export default useRealtimeGraph;