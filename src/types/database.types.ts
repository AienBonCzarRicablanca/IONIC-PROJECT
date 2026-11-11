export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointment_status_history: {
        Row: {
          appointment_id: string
          changed_at: string
          changed_by: string | null
          clinic_id: string
          id: string
          new_status: Database["public"]["Enums"]["appointment_status"]
          old_status: Database["public"]["Enums"]["appointment_status"] | null
        }
        Insert: {
          appointment_id: string
          changed_at?: string
          changed_by?: string | null
          clinic_id: string
          id?: string
          new_status: Database["public"]["Enums"]["appointment_status"]
          old_status?: Database["public"]["Enums"]["appointment_status"] | null
        }
        Update: {
          appointment_id?: string
          changed_at?: string
          changed_by?: string | null
          clinic_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["appointment_status"]
          old_status?: Database["public"]["Enums"]["appointment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_status_history_appointment_id_clinic_id_fkey"
            columns: ["appointment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointment_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_status_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          chair_name: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          dentist_id: string
          ends_at: string
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          service_id: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          chair_name?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          dentist_id: string
          ends_at: string
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          service_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          chair_name?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          dentist_id?: string
          ends_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          service_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dentist_id_clinic_id_fkey"
            columns: ["dentist_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointments_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointments_service_id_clinic_id_fkey"
            columns: ["service_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          clinic_id: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          clinic_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          clinic_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: never
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_memberships: {
        Row: {
          clinic_id: string
          created_at: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_memberships_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          content: string
          created_at: string
          dentist_id: string
          id: string
          is_shared_with_patient: boolean
          patient_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          content: string
          created_at?: string
          dentist_id: string
          id?: string
          is_shared_with_patient?: boolean
          patient_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          content?: string
          created_at?: string
          dentist_id?: string
          id?: string
          is_shared_with_patient?: boolean
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_appointment_id_clinic_id_fkey"
            columns: ["appointment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "clinical_notes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_dentist_id_clinic_id_fkey"
            columns: ["dentist_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_email: string
          sender_name: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_email: string
          sender_name: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_email?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_records: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          dentist_id: string
          diagnosis: string
          follow_up_instructions: string | null
          id: string
          observations: string | null
          patient_id: string
          procedures_performed: string | null
          recommendations: string | null
          recorded_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          dentist_id: string
          diagnosis: string
          follow_up_instructions?: string | null
          id?: string
          observations?: string | null
          patient_id: string
          procedures_performed?: string | null
          recommendations?: string | null
          recorded_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          dentist_id?: string
          diagnosis?: string
          follow_up_instructions?: string | null
          id?: string
          observations?: string | null
          patient_id?: string
          procedures_performed?: string | null
          recommendations?: string | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_records_appointment_id_clinic_id_fkey"
            columns: ["appointment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "dental_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_records_dentist_id_clinic_id_fkey"
            columns: ["dentist_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "dental_records_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      dentists: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean
          license_number: string | null
          profile_id: string
          specialization: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          profile_id: string
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          profile_id?: string
          specialization?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentists_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dentists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          id: string
          image_path: string | null
          is_archived: boolean
          name: string
          quantity: number
          reorder_threshold: number
          supplier: string | null
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_archived?: boolean
          name: string
          quantity?: number
          reorder_threshold?: number
          supplier?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_archived?: boolean
          name?: string
          quantity?: number
          reorder_threshold?: number
          supplier?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          actor_id: string
          clinic_id: string
          created_at: string
          id: string
          item_id: string
          note: string | null
          quantity_change: number
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
        }
        Insert: {
          actor_id: string
          clinic_id: string
          created_at?: string
          id?: string
          item_id: string
          note?: string | null
          quantity_change: number
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
        }
        Update: {
          actor_id?: string
          clinic_id?: string
          created_at?: string
          id?: string
          item_id?: string
          note?: string | null
          quantity_change?: number
          transaction_type?: Database["public"]["Enums"]["inventory_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_clinic_id_fkey"
            columns: ["item_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          clinic_id: string
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total: number | null
          quantity: number
          service_id: string | null
          unit_price: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total?: number | null
          quantity?: number
          service_id?: string | null
          unit_price: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number | null
          quantity?: number
          service_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_clinic_id_fkey"
            columns: ["invoice_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_clinic_id_fkey"
            columns: ["service_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          discount: number
          due_at: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          patient_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          discount?: number
          due_at?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          discount?: number
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_clinic_id_fkey"
            columns: ["appointment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      notifications: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      odontogram_entries: {
        Row: {
          clinic_id: string
          condition: Database["public"]["Enums"]["dental_condition"]
          dentition: string
          id: string
          notes: string | null
          patient_id: string
          recorded_by: string
          tooth_number: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          condition?: Database["public"]["Enums"]["dental_condition"]
          dentition: string
          id?: string
          notes?: string | null
          patient_id: string
          recorded_by: string
          tooth_number: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          condition?: Database["public"]["Enums"]["dental_condition"]
          dentition?: string
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_by?: string
          tooth_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontogram_entries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogram_entries_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "odontogram_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          anchor: string | null
          bio: string
          clinic_id: string
          created_at: string
          full_name: string
          id: string
          parent_id: string | null
          photo_path: string | null
          pos_x: number
          pos_y: number
          role_title: string
          updated_at: string
        }
        Insert: {
          anchor?: string | null
          bio?: string
          clinic_id: string
          created_at?: string
          full_name: string
          id?: string
          parent_id?: string | null
          photo_path?: string | null
          pos_x?: number
          pos_y?: number
          role_title?: string
          updated_at?: string
        }
        Update: {
          anchor?: string | null
          bio?: string
          clinic_id?: string
          created_at?: string
          full_name?: string
          id?: string
          parent_id?: string | null
          photo_path?: string | null
          pos_x?: number
          pos_y?: number
          role_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "org_members"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_files: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          mime_type: string
          original_name: string
          patient_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          mime_type: string
          original_name: string
          patient_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          mime_type?: string
          original_name?: string
          patient_id?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_files_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_files_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "patient_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          clinic_id: string
          contact_number: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_number: string | null
          full_name: string
          id: string
          medical_history: string | null
          profile_id: string | null
          sex: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          clinic_id: string
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          full_name: string
          id?: string
          medical_history?: string | null
          profile_id?: string | null
          sex?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          clinic_id?: string
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          full_name?: string
          id?: string
          medical_history?: string | null
          profile_id?: string | null
          sex?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_installments: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          due_at: string
          id: string
          invoice_id: string
          paid_at: string | null
        }
        Insert: {
          amount: number
          clinic_id: string
          created_at?: string
          due_at: string
          id?: string
          invoice_id: string
          paid_at?: string | null
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          due_at?: string
          id?: string
          invoice_id?: string
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_invoice_id_clinic_id_fkey"
            columns: ["invoice_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          id: string
          invoice_id: string
          is_confirmed: boolean
          method: Database["public"]["Enums"]["payment_method"]
          received_by: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          clinic_id: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          is_confirmed?: boolean
          method: Database["public"]["Enums"]["payment_method"]
          received_by?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          clinic_id?: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          is_confirmed?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          received_by?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_clinic_id_fkey"
            columns: ["invoice_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          contact_number: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          contact_number?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          contact_number?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      queues: {
        Row: {
          added_at: string
          appointment_id: string
          clinic_id: string
          id: string
          queue_number: number
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
        }
        Insert: {
          added_at?: string
          appointment_id: string
          clinic_id: string
          id?: string
          queue_number: number
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Update: {
          added_at?: string
          appointment_id?: string
          clinic_id?: string
          id?: string
          queue_number?: number
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queues_appointment_id_clinic_id_fkey"
            columns: ["appointment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "queues_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plan_items: {
        Row: {
          clinic_id: string
          cost: number
          created_at: string
          description: string
          id: string
          notes: string | null
          plan_id: string
          planned_date: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["treatment_status"]
          tooth_number: number | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          cost?: number
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          plan_id: string
          planned_date?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["treatment_status"]
          tooth_number?: number | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          cost?: number
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          plan_id?: string
          planned_date?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["treatment_status"]
          tooth_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_plan_id_clinic_id_fkey"
            columns: ["plan_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "treatment_plan_items_service_id_clinic_id_fkey"
            columns: ["service_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "treatment_plan_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          clinic_id: string
          created_at: string
          dentist_id: string
          id: string
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["treatment_status"]
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          dentist_id: string
          id?: string
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["treatment_status"]
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          dentist_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["treatment_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_dentist_id_clinic_id_fkey"
            columns: ["dentist_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "treatment_plans_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_my_profile: {
        Args: { p_contact_number: string | null; p_full_name: string }
        Returns: undefined
      }
      update_my_patient_details: {
        Args: {
          p_address: string | null
          p_allergies: string | null
          p_date_of_birth: string | null
          p_emergency_contact_name: string | null
          p_emergency_contact_number: string | null
          p_medical_history: string | null
          p_sex: string | null
        }
        Returns: undefined
      }
      cancel_my_appointment: {
        Args: { p_appointment: string }
        Returns: undefined
      }
      submit_contact_message: {
        Args: { p_email: string; p_message: string; p_name: string }
        Returns: undefined
      }
      simulate_my_payment: {
        Args: { p_amount: number; p_invoice: string; p_method: string; p_reference: string }
        Returns: undefined
      }
      dentist_busy_slots: {
        Args: { p_dentist: string; p_from: string; p_to: string }
        Returns: {
          ends_at: string
          starts_at: string
        }[]
      }
      member_avatar_paths: {
        Args: { user_ids: string[] }
        Returns: {
          avatar_path: string | null
          user_id: string
        }[]
      }
      list_public_dentists: {
        Args: never
        Returns: {
          avatar_path: string | null
          full_name: string
          id: string
          specialization: string | null
        }[]
      }
      list_bookable_dentists: {
        Args: never
        Returns: {
          full_name: string
          id: string
          specialization: string
        }[]
      }
      list_clinic_accounts: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      set_staff_role: {
        Args: {
          make_active?: boolean
          new_role: Database["public"]["Enums"]["app_role"]
          target_user: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "dentist" | "patient"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      dental_condition:
        | "healthy"
        | "decayed"
        | "filled"
        | "missing"
        | "crown"
        | "root_canal"
      inventory_transaction_type: "addition" | "consumption" | "adjustment"
      invoice_status: "draft" | "issued" | "partially_paid" | "paid" | "void"
      payment_method:
        | "cash"
        | "gcash"
        | "card"
        | "bank_transfer"
        | "installment"
        | "other"
      queue_status: "waiting" | "in_session" | "done"
      treatment_status: "planned" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["superadmin", "admin", "dentist", "patient"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      dental_condition: [
        "healthy",
        "decayed",
        "filled",
        "missing",
        "crown",
        "root_canal",
      ],
      inventory_transaction_type: ["addition", "consumption", "adjustment"],
      invoice_status: ["draft", "issued", "partially_paid", "paid", "void"],
      payment_method: [
        "cash",
        "gcash",
        "card",
        "bank_transfer",
        "installment",
        "other",
      ],
      queue_status: ["waiting", "in_session", "done"],
      treatment_status: ["planned", "in_progress", "completed", "cancelled"],
    },
  },
} as const
