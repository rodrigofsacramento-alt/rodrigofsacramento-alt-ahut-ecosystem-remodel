import { createClient } from '@supabase/supabase-js';

// ⚠️ DEV ENVIRONMENT apenas — usa service_role para bypass de RLS
// Para produção, trocar por anon key com RLS policies apropriadas
const supabaseUrl = 'https://mizeybqkgvuulbatsvte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pemV5YnFrZ3Z1dWxiYXRzdnRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTk1MzkwOSwiZXhwIjoyMDk3NTI5OTA5fQ.CQHU8Oicl4_sFyPSHBg_OnvTkUmzoF265l_l-X4xdzE';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'agent' | 'client';
  tenant_id: string;
  avatar_url?: string;
  creci?: string;
  is_active: boolean;
};

export type Lead = {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  stage: string;
  sla_status: string;
  sla_deadline?: string;
  source: string;
  budget?: string;
  interest?: string;
  location?: string;
  property_id?: string;
  responsible_id?: string;
  notes?: string;
  created_at: string;
};

export type Property = {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  description: string;
  location: string;
  address: string;
  price: number;
  price_type: 'Venda' | 'Aluguel';
  status: 'available' | 'reserved' | 'sold' | 'rented';
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parking: number;
  rooms: number;
  image_url?: string;
  images?: string[];
  owner_name?: string;
  owner_phone?: string;
  agent_id?: string;
  created_at: string;
};

export type Visit = {
  id: string;
  tenant_id: string;
  lead_id: string;
  property_id: string;
  agent_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  feedback?: string;
  rating?: number;
  notes?: string;
  created_at: string;
};

export type Proposal = {
  id: string;
  tenant_id: string;
  proposal_number: string;
  client_name: string;
  value: number;
  status: string;
  payment_type: string;
  current_stage: number;
  lead_id: string;
  property_id: string;
  agent_id: string;
  created_at: string;
};

export type Contract = {
  id: string;
  tenant_id: string;
  contract_number: string;
  client_name: string;
  value: number;
  status: 'active' | 'pending' | 'finished' | 'cancelled';
  type: 'sale' | 'rent';
  property_id: string;
  lead_id: string;
  agent_id: string;
  start_date: string;
  end_date?: string;
  created_at: string;
};
