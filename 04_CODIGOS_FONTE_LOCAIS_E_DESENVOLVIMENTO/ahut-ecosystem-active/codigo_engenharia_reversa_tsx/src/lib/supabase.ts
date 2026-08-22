import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ldfcqxeehgaftxsgxkag.supabase.co';
const supabaseKey = 'sb_publishable_-y-THJEYisTiITNGLJehIw_3bWL4-ky';

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
