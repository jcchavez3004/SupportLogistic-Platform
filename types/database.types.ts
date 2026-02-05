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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string | null
          client_id: string | null
          phone: string | null
          vehicle_plate: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          client_id?: string | null
          phone?: string | null
          vehicle_plate?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          client_id?: string | null
          phone?: string | null
          vehicle_plate?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          company_name: string
          nit: string | null
          address: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          nit?: string | null
          address?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          nit?: string | null
          address?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          service_number: number | null
          client_id: string
          driver_id: string | null
          status: string
          pickup_address: string
          pickup_contact_name: string | null
          pickup_phone: string | null
          delivery_address: string
          delivery_contact_name: string | null
          delivery_phone: string | null
          observations: string | null
          evidence_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_number?: number | null
          client_id: string
          driver_id?: string | null
          status: string
          pickup_address: string
          pickup_contact_name?: string | null
          pickup_phone?: string | null
          delivery_address: string
          delivery_contact_name?: string | null
          delivery_phone?: string | null
          observations?: string | null
          evidence_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_number?: number | null
          client_id?: string
          driver_id?: string | null
          status?: string
          pickup_address?: string
          pickup_contact_name?: string | null
          pickup_phone?: string | null
          delivery_address?: string
          delivery_contact_name?: string | null
          delivery_phone?: string | null
          observations?: string | null
          evidence_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_driver_id_fkey"
            columns: ["driver_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      client_status: 'active' | 'inactive' | 'archived'
      // Ajusta estos valores si tu ENUM real difiere.
      service_status:
        | 'solicitado'
        | 'asignado'
        | 'en_curso_recogida'
        | 'recogido'
        | 'en_curso_entrega'
        | 'entregado'
        | 'novedad'
      service_priority: 'low' | 'medium' | 'high' | 'urgent'
    }
  }
}

// Tipos auxiliares para facilitar el uso
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type Service = Database['public']['Tables']['services']['Row']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']

export type ClientStatus = Database['public']['Enums']['client_status']
export type ServiceStatus = Database['public']['Enums']['service_status']
export type ServicePriority = Database['public']['Enums']['service_priority']
