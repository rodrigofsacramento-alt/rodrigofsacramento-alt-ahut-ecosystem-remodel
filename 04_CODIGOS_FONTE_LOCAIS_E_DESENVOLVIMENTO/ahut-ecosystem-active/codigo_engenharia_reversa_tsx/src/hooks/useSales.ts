import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type SaleRecord = Database['public']['Tables']['sales_records']['Row'] & {
  property: Database['public']['Tables']['properties']['Row'] | null;
  proposal: Database['public']['Tables']['proposals']['Row'] | null;
  agent: Database['public']['Tables']['profiles']['Row'] | null;
};

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_records')
        .select(`
          *,
          property:properties!sales_records_property_id_fkey(*),
          proposal:proposals!sales_records_proposal_id_fkey(*),
          agent:profiles!sales_records_agent_id_fkey(*)
        `)
        .order('contract_signed_at', { ascending: false });

      if (error) throw error;
      return data as SaleRecord[];
    }
  });
}

export function useAddSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleData: any) => {
      const { data, error } = await supabase
        .from('sales_records')
        .insert(saleData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    }
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, property_id }: { id: string, property_id: string }) => {
      const { error: deleteError } = await supabase
        .from('sales_records')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('properties')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', property_id);

      if (updateError) throw updateError;

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    }
  });
}
