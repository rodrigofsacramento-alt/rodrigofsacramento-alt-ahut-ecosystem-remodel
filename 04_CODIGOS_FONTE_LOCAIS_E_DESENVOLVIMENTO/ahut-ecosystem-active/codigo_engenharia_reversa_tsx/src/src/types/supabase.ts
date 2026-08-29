export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sales_records: {
        Row: {
          id: string
          property_id: string | null
          proposal_id: string | null
          agent_id: string | null
          buyer_name: string
          sale_value: number
          contract_signed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          proposal_id?: string | null
          agent_id?: string | null
          buyer_name: string
          sale_value: number
          contract_signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          proposal_id?: string | null
          agent_id?: string | null
          buyer_name?: string
          sale_value?: number
          contract_signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          code: string
          title: string
          status: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      proposals: {
        Row: {
          id: string
          created_at: string
        }
        Insert: any
        Update: any
      }
      profiles: {
        Row: {
          id: string
          full_name: string
        }
        Insert: any
        Update: any
      }
    }
  }
}
