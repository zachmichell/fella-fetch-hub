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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          attended: boolean | null
          cancelled_at: string | null
          class_instance_id: string
          created_at: string
          enrolled_at: string
          enrolled_by: string | null
          id: string
          invoice_id: string | null
          organization_id: string
          owner_id: string
          payment_status: string
          pet_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attended?: boolean | null
          cancelled_at?: string | null
          class_instance_id: string
          created_at?: string
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          invoice_id?: string | null
          organization_id: string
          owner_id: string
          payment_status?: string
          pet_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attended?: boolean | null
          cancelled_at?: string | null
          class_instance_id?: string
          created_at?: string
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          invoice_id?: string | null
          organization_id?: string
          owner_id?: string
          payment_status?: string
          pet_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      class_instances: {
        Row: {
          auto_generated: boolean
          class_type_id: string
          created_at: string
          deleted_at: string | null
          end_at: string
          id: string
          instructor_user_id: string | null
          location_id: string | null
          notes: string | null
          organization_id: string
          start_at: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_generated?: boolean
          class_type_id: string
          created_at?: string
          deleted_at?: string | null
          end_at: string
          id?: string
          instructor_user_id?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id: string
          start_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_generated?: boolean
          class_type_id?: string
          created_at?: string
          deleted_at?: string | null
          end_at?: string
          id?: string
          instructor_user_id?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id?: string
          start_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_instances_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          instructor_user_id: string | null
          location_id: string | null
          max_enrollment: number
          name: string
          organization_id: string
          prerequisites: string | null
          price_cents: number
          schedule_day_of_week: number | null
          schedule_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_user_id?: string | null
          location_id?: string | null
          max_enrollment?: number
          name: string
          organization_id: string
          prerequisites?: string | null
          price_cents?: number
          schedule_day_of_week?: number | null
          schedule_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_user_id?: string | null
          location_id?: string | null
          max_enrollment?: number
          name?: string
          organization_id?: string
          prerequisites?: string | null
          price_cents?: number
          schedule_day_of_week?: number | null
          schedule_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_types_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          organization_id: string
          owner_id: string
          unread_owner: number
          unread_staff: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          organization_id: string
          owner_id: string
          unread_owner?: number
          unread_staff?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          organization_id?: string
          owner_id?: string
          unread_owner?: number
          unread_staff?: number
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          mime_type: string | null
          name: string
          organization_id: string
          owner_id: string | null
          pet_id: string | null
          size_bytes: number | null
          updated_at: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          mime_type?: string | null
          name: string
          organization_id: string
          owner_id?: string | null
          pet_id?: string | null
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          pet_id?: string | null
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          organization_id: string
          recipient_count: number
          segment: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          recipient_count?: number
          segment?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          recipient_count?: number
          segment?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          email_type: string
          error_message: string | null
          id: string
          message_id: string | null
          organization_id: string | null
          recipient_email: string
          sent_at: string
          status: string
          subject: string
        }
        Insert: {
          email_type: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          organization_id?: string | null
          recipient_email: string
          sent_at?: string
          status: string
          subject: string
        }
        Update: {
          email_type?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          organization_id?: string | null
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          created_at: string
          id: string
          invoice_created_enabled: boolean
          organization_id: string
          report_card_published_enabled: boolean
          reservation_confirmation_enabled: boolean
          sender_name: string | null
          updated_at: string
          waiver_reminder_enabled: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_created_enabled?: boolean
          organization_id: string
          report_card_published_enabled?: boolean
          reservation_confirmation_enabled?: boolean
          sender_name?: string | null
          updated_at?: string
          waiver_reminder_enabled?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          invoice_created_enabled?: boolean
          organization_id?: string
          report_card_published_enabled?: boolean
          reservation_confirmation_enabled?: boolean
          sender_name?: string | null
          updated_at?: string
          waiver_reminder_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "email_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organization_id: string
          owner_id: string
          phone: string
          relationship: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organization_id: string
          owner_id: string
          phone: string
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string
          phone?: string
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_pets: {
        Row: {
          created_at: string
          id: string
          incident_id: string
          injury_description: string | null
          organization_id: string
          pet_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id: string
          injury_description?: string | null
          organization_id: string
          pet_id: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string
          injury_description?: string | null
          organization_id?: string
          pet_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_pets_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          action_taken: string | null
          created_at: string
          description: string
          follow_up_completed_at: string | null
          follow_up_notes: string | null
          follow_up_required: boolean
          id: string
          incident_at: string
          incident_type: string
          location_id: string | null
          organization_id: string
          owner_notified: boolean
          owner_notified_at: string | null
          owner_visible: boolean
          reported_by: string | null
          reservation_id: string | null
          severity: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          description: string
          follow_up_completed_at?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean
          id?: string
          incident_at: string
          incident_type: string
          location_id?: string | null
          organization_id: string
          owner_notified?: boolean
          owner_notified_at?: string | null
          owner_visible?: boolean
          reported_by?: string | null
          reservation_id?: string | null
          severity: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          description?: string
          follow_up_completed_at?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean
          id?: string
          incident_at?: string
          incident_type?: string
          location_id?: string | null
          organization_id?: string
          owner_notified?: boolean
          owner_notified_at?: string | null
          owner_visible?: boolean
          reported_by?: string | null
          reservation_id?: string | null
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total_cents: number
          organization_id: string
          quantity: number
          service_id: string | null
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total_cents: number
          organization_id: string
          quantity?: number
          service_id?: string | null
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total_cents?: number
          organization_id?: string
          quantity?: number
          service_id?: string | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_taxes: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          invoice_id: string
          name: string
          organization_id: string
          rate_basis_points: number
          tax_rule_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          invoice_id: string
          name: string
          organization_id: string
          rate_basis_points: number
          tax_rule_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          invoice_id?: string
          name?: string
          organization_id?: string
          rate_basis_points?: number
          tax_rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_taxes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_taxes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_taxes_tax_rule_id_fkey"
            columns: ["tax_rule_id"]
            isOneToOne: false
            referencedRelation: "tax_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid_cents: number
          balance_due_cents: number | null
          cashier_user_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_enum"]
          deleted_at: string | null
          due_at: string | null
          id: string
          invoice_number: string | null
          issued_at: string | null
          location_id: string | null
          notes: string | null
          organization_id: string
          owner_id: string
          paid_at: string | null
          promotion_discount_cents: number
          promotion_id: string | null
          reservation_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          store_credit_applied_cents: number
          stripe_checkout_session_id: string | null
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          balance_due_cents?: number | null
          cashier_user_id?: string | null
          created_at?: string
          currency: Database["public"]["Enums"]["currency_enum"]
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id: string
          owner_id: string
          paid_at?: string | null
          promotion_discount_cents?: number
          promotion_id?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          store_credit_applied_cents?: number
          stripe_checkout_session_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          balance_due_cents?: number | null
          cashier_user_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_enum"]
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          location_id?: string | null
          notes?: string | null
          organization_id?: string
          owner_id?: string
          paid_at?: string | null
          promotion_discount_cents?: number
          promotion_id?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          store_credit_applied_cents?: number
          stripe_checkout_session_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      kennel_run_assignments: {
        Row: {
          assigned_at: string
          assigned_by_user_id: string | null
          created_at: string
          id: string
          kennel_run_id: string
          organization_id: string
          pet_id: string
          removed_at: string | null
          reservation_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by_user_id?: string | null
          created_at?: string
          id?: string
          kennel_run_id: string
          organization_id: string
          pet_id: string
          removed_at?: string | null
          reservation_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by_user_id?: string | null
          created_at?: string
          id?: string
          kennel_run_id?: string
          organization_id?: string
          pet_id?: string
          removed_at?: string | null
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kennel_run_assignments_kennel_run_id_fkey"
            columns: ["kennel_run_id"]
            isOneToOne: false
            referencedRelation: "kennel_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kennel_run_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kennel_run_assignments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kennel_run_assignments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      kennel_runs: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          daily_rate_modifier_cents: number
          deleted_at: string | null
          id: string
          location_id: string | null
          name: string
          organization_id: string
          run_type: Database["public"]["Enums"]["kennel_run_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          daily_rate_modifier_cents?: number
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          name: string
          organization_id: string
          run_type?: Database["public"]["Enums"]["kennel_run_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          daily_rate_modifier_cents?: number
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          name?: string
          organization_id?: string
          run_type?: Database["public"]["Enums"]["kennel_run_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kennel_runs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kennel_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_hours: {
        Row: {
          close_time: string | null
          closed: boolean
          created_at: string
          day_of_week: number
          id: string
          location_id: string
          open_time: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          closed?: boolean
          created_at?: string
          day_of_week: number
          id?: string
          location_id: string
          open_time?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          closed?: boolean
          created_at?: string
          day_of_week?: number
          id?: string
          location_id?: string
          open_time?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          state_province: string | null
          street_address: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state_province?: string | null
          street_address?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state_province?: string | null
          street_address?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          active: boolean
          created_at: string
          id: string
          location_ids: string[] | null
          organization_id: string
          profile_id: string
          role: Database["public"]["Enums"]["membership_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          location_ids?: string[] | null
          organization_id: string
          profile_id: string
          role: Database["public"]["Enums"]["membership_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          location_ids?: string[] | null
          organization_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          organization_id: string
          template_text: string
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          organization_id: string
          template_text?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          organization_id?: string
          template_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          country: Database["public"]["Enums"]["country_enum"]
          created_at: string
          currency: Database["public"]["Enums"]["currency_enum"]
          deleted_at: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["org_status_enum"]
          timezone: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          country: Database["public"]["Enums"]["country_enum"]
          created_at?: string
          currency: Database["public"]["Enums"]["currency_enum"]
          deleted_at?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["org_status_enum"]
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          country?: Database["public"]["Enums"]["country_enum"]
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_enum"]
          deleted_at?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["org_status_enum"]
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      owner_subscriptions: {
        Row: {
          created_at: string
          id: string
          next_billing_date: string | null
          organization_id: string
          owner_id: string
          package_id: string
          purchased_at: string
          remaining_credits: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_billing_date?: string | null
          organization_id: string
          owner_id: string
          package_id: string
          purchased_at?: string
          remaining_credits?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          next_billing_date?: string | null
          organization_id?: string
          owner_id?: string
          package_id?: string
          purchased_at?: string
          remaining_credits?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      owners: {
        Row: {
          city: string | null
          communication_preference: Database["public"]["Enums"]["communication_pref"]
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          profile_id: string | null
          state_province: string | null
          store_credit_cents: number
          street_address: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          communication_preference?: Database["public"]["Enums"]["communication_pref"]
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          profile_id?: string | null
          state_province?: string | null
          store_credit_cents?: number
          street_address?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          communication_preference?: Database["public"]["Enums"]["communication_pref"]
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          profile_id?: string | null
          state_province?: string | null
          store_credit_cents?: number
          street_address?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owners_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_enum"]
          deleted_at: string | null
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method_enum"]
          organization_id: string
          processed_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency: Database["public"]["Enums"]["currency_enum"]
          deleted_at?: string | null
          id?: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method_enum"]
          organization_id: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_enum"]
          deleted_at?: string | null
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method_enum"]
          organization_id?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invitations: {
        Row: {
          consumed_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          organization_id: string
          role: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
        }
        Relationships: []
      }
      pet_care_logs: {
        Row: {
          created_at: string
          id: string
          log_type: string
          logged_at: string
          logged_by: string | null
          notes: string | null
          organization_id: string
          pet_id: string
          reference_id: string | null
          reservation_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          log_type: string
          logged_at?: string
          logged_by?: string | null
          notes?: string | null
          organization_id: string
          pet_id: string
          reference_id?: string | null
          reservation_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          log_type?: string
          logged_at?: string
          logged_by?: string | null
          notes?: string | null
          organization_id?: string
          pet_id?: string
          reference_id?: string | null
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_care_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_care_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_care_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_care_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_feeding_schedules: {
        Row: {
          amount: string | null
          created_at: string
          food_type: string
          frequency: string | null
          id: string
          instructions: string | null
          is_active: boolean
          organization_id: string
          pet_id: string
          timing: string | null
          updated_at: string
        }
        Insert: {
          amount?: string | null
          created_at?: string
          food_type: string
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          organization_id: string
          pet_id: string
          timing?: string | null
          updated_at?: string
        }
        Update: {
          amount?: string | null
          created_at?: string
          food_type?: string
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          organization_id?: string
          pet_id?: string
          timing?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_feeding_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_feeding_schedules_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_medications: {
        Row: {
          created_at: string
          dosage: string | null
          frequency: string | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          organization_id: string
          pet_id: string
          timing: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          organization_id: string
          pet_id: string
          timing?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          organization_id?: string
          pet_id?: string
          timing?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_medications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_medications_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_owners: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          owner_id: string
          pet_id: string
          relationship: Database["public"]["Enums"]["pet_owner_relationship"]
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          owner_id: string
          pet_id: string
          relationship?: Database["public"]["Enums"]["pet_owner_relationship"]
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          owner_id?: string
          pet_id?: string
          relationship?: Database["public"]["Enums"]["pet_owner_relationship"]
        }
        Relationships: [
          {
            foreignKeyName: "pet_owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_owners_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_owners_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_traits: {
        Row: {
          added_by: string | null
          category: string
          created_at: string
          id: string
          label: string
          notes: string | null
          organization_id: string
          pet_id: string
          severity: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          category: string
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          organization_id: string
          pet_id: string
          severity?: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          category?: string
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          organization_id?: string
          pet_id?: string
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          allergies: string | null
          behavioral_notes: string | null
          breed: string | null
          color: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          feeding_notes: string | null
          id: string
          intake_status: Database["public"]["Enums"]["intake_status_enum"]
          markings: string | null
          medication_notes: string | null
          microchip_id: string | null
          name: string
          organization_id: string
          photo_url: string | null
          sex: Database["public"]["Enums"]["sex_enum"]
          spayed_neutered: boolean | null
          species: Database["public"]["Enums"]["species_enum"]
          temperament_tags: string[]
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          allergies?: string | null
          behavioral_notes?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          feeding_notes?: string | null
          id?: string
          intake_status?: Database["public"]["Enums"]["intake_status_enum"]
          markings?: string | null
          medication_notes?: string | null
          microchip_id?: string | null
          name: string
          organization_id: string
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["sex_enum"]
          spayed_neutered?: boolean | null
          species?: Database["public"]["Enums"]["species_enum"]
          temperament_tags?: string[]
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          allergies?: string | null
          behavioral_notes?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          feeding_notes?: string | null
          id?: string
          intake_status?: Database["public"]["Enums"]["intake_status_enum"]
          markings?: string | null
          medication_notes?: string | null
          microchip_id?: string | null
          name?: string
          organization_id?: string
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["sex_enum"]
          spayed_neutered?: boolean | null
          species?: Database["public"]["Enums"]["species_enum"]
          temperament_tags?: string[]
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      playgroup_assignments: {
        Row: {
          assigned_at: string
          assigned_by_user_id: string | null
          created_at: string
          id: string
          organization_id: string
          pet_id: string
          playgroup_id: string
          removed_at: string | null
          reservation_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by_user_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          pet_id: string
          playgroup_id: string
          removed_at?: string | null
          reservation_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by_user_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          pet_id?: string
          playgroup_id?: string
          removed_at?: string | null
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playgroup_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playgroup_assignments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playgroup_assignments_playgroup_id_fkey"
            columns: ["playgroup_id"]
            isOneToOne: false
            referencedRelation: "playgroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playgroup_assignments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      playgroups: {
        Row: {
          active: boolean
          capacity: number | null
          color: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          location_id: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number | null
          color?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number | null
          color?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playgroups_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playgroups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          item_kind: string
          line_total_cents: number
          name: string
          organization_id: string
          package_id: string | null
          product_id: string | null
          quantity: number
          service_id: string | null
          unit_price_cents: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          item_kind: string
          line_total_cents?: number
          name: string
          organization_id: string
          package_id?: string | null
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          unit_price_cents?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          item_kind?: string
          line_total_cents?: number
          name?: string
          organization_id?: string
          package_id?: string | null
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          unit_price_cents?: number
        }
        Relationships: []
      }
      pos_carts: {
        Row: {
          applied_store_credit_cents: number
          cashier_user_id: string | null
          charged_at: string | null
          created_at: string
          discount_cents: number
          id: string
          invoice_id: string | null
          notes: string | null
          organization_id: string
          owner_id: string
          promotion_id: string | null
          status: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
          voided_at: string | null
        }
        Insert: {
          applied_store_credit_cents?: number
          cashier_user_id?: string | null
          charged_at?: string | null
          created_at?: string
          discount_cents?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id: string
          owner_id: string
          promotion_id?: string | null
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          voided_at?: string | null
        }
        Update: {
          applied_store_credit_cents?: number
          cashier_user_id?: string | null
          charged_at?: string | null
          created_at?: string
          discount_cents?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string
          owner_id?: string
          promotion_id?: string | null
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          voided_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          max_uses: number | null
          organization_id: string
          updated_at: string
          usage_count: number
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_uses?: number | null
          organization_id: string
          updated_at?: string
          usage_count?: number
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_uses?: number | null
          organization_id?: string
          updated_at?: string
          usage_count?: number
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      recurring_reservation_groups: {
        Row: {
          created_at: string
          created_by: string | null
          days_of_week: number[]
          end_date: string | null
          end_time: string
          id: string
          location_id: string | null
          max_occurrences: number | null
          notes: string | null
          organization_id: string
          owner_id: string
          pet_ids: string[]
          service_id: string | null
          start_date: string
          start_time: string
          status: string
          suite_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          end_date?: string | null
          end_time: string
          id?: string
          location_id?: string | null
          max_occurrences?: number | null
          notes?: string | null
          organization_id: string
          owner_id: string
          pet_ids?: string[]
          service_id?: string | null
          start_date: string
          start_time: string
          status?: string
          suite_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          end_date?: string | null
          end_time?: string
          id?: string
          location_id?: string | null
          max_occurrences?: number | null
          notes?: string | null
          organization_id?: string
          owner_id?: string
          pet_ids?: string[]
          service_id?: string | null
          start_date?: string
          start_time?: string
          status?: string
          suite_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_cards: {
        Row: {
          appetite: string | null
          created_at: string
          created_by: string | null
          energy_level: string | null
          id: string
          mood: string | null
          organization_id: string
          overall_rating: string | null
          pet_id: string
          photo_urls: string[]
          published: boolean
          published_at: string | null
          reservation_id: string
          sociability: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          appetite?: string | null
          created_at?: string
          created_by?: string | null
          energy_level?: string | null
          id?: string
          mood?: string | null
          organization_id: string
          overall_rating?: string | null
          pet_id: string
          photo_urls?: string[]
          published?: boolean
          published_at?: string | null
          reservation_id: string
          sociability?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          appetite?: string | null
          created_at?: string
          created_by?: string | null
          energy_level?: string | null
          id?: string
          mood?: string | null
          organization_id?: string
          overall_rating?: string | null
          pet_id?: string
          photo_urls?: string[]
          published?: boolean
          published_at?: string | null
          reservation_id?: string
          sociability?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_pets: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          pet_id: string
          reservation_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          pet_id: string
          reservation_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          pet_id?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_pets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_pets_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          checked_in_at: string | null
          checked_in_by_user_id: string | null
          checked_out_at: string | null
          checked_out_by_user_id: string | null
          confirmed_at: string | null
          confirmed_by_user_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          end_at: string
          id: string
          is_recurring: boolean
          location_id: string | null
          notes: string | null
          organization_id: string
          primary_owner_id: string | null
          recurring_group_id: string | null
          requested_at: string | null
          service_id: string | null
          source: Database["public"]["Enums"]["reservation_source"]
          start_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          suite_id: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          checked_in_at?: string | null
          checked_in_by_user_id?: string | null
          checked_out_at?: string | null
          checked_out_by_user_id?: string | null
          confirmed_at?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_at: string
          id?: string
          is_recurring?: boolean
          location_id?: string | null
          notes?: string | null
          organization_id: string
          primary_owner_id?: string | null
          recurring_group_id?: string | null
          requested_at?: string | null
          service_id?: string | null
          source?: Database["public"]["Enums"]["reservation_source"]
          start_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          suite_id?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          checked_in_at?: string | null
          checked_in_by_user_id?: string | null
          checked_out_at?: string | null
          checked_out_by_user_id?: string | null
          confirmed_at?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_at?: string
          id?: string
          is_recurring?: boolean
          location_id?: string | null
          notes?: string | null
          organization_id?: string
          primary_owner_id?: string | null
          recurring_group_id?: string | null
          requested_at?: string | null
          service_id?: string | null
          source?: Database["public"]["Enums"]["reservation_source"]
          start_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          suite_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_primary_owner_id_fkey"
            columns: ["primary_owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_recurring_group_id_fkey"
            columns: ["recurring_group_id"]
            isOneToOne: false
            referencedRelation: "recurring_reservation_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "suites"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_products: {
        Row: {
          active: boolean
          category: string
          cost_cents: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          manufacturer: string | null
          name: string
          organization_id: string
          photo_url: string | null
          price_cents: number
          reorder_point: number
          sku: string | null
          stock_quantity: number
          updated_at: string
          vendor: string | null
        }
        Insert: {
          active?: boolean
          category?: string
          cost_cents?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          manufacturer?: string | null
          name: string
          organization_id: string
          photo_url?: string | null
          price_cents?: number
          reorder_point?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          cost_cents?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          manufacturer?: string | null
          name?: string
          organization_id?: string
          photo_url?: string | null
          price_cents?: number
          reorder_point?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          base_price_cents: number
          created_at: string
          deleted_at: string | null
          description: string | null
          duration_minutes: number | null
          duration_type: Database["public"]["Enums"]["duration_type_enum"]
          id: string
          is_addon: boolean
          location_id: string | null
          max_pets_per_booking: number | null
          module: Database["public"]["Enums"]["module_enum"]
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price_cents?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          duration_type: Database["public"]["Enums"]["duration_type_enum"]
          id?: string
          is_addon?: boolean
          location_id?: string | null
          max_pets_per_booking?: number | null
          module: Database["public"]["Enums"]["module_enum"]
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price_cents?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          duration_type?: Database["public"]["Enums"]["duration_type_enum"]
          id?: string
          is_addon?: boolean
          location_id?: string | null
          max_pets_per_booking?: number | null
          module?: Database["public"]["Enums"]["module_enum"]
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_connect_accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["connect_account_type"]
          charges_enabled: boolean
          created_at: string
          deleted_at: string | null
          details_submitted: boolean
          id: string
          organization_id: string
          payouts_enabled: boolean
          status: string
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["connect_account_type"]
          charges_enabled?: boolean
          created_at?: string
          deleted_at?: string | null
          details_submitted?: boolean
          id?: string
          organization_id: string
          payouts_enabled?: boolean
          status?: string
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["connect_account_type"]
          charges_enabled?: boolean
          created_at?: string
          deleted_at?: string | null
          details_submitted?: boolean
          id?: string
          organization_id?: string
          payouts_enabled?: boolean
          status?: string
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_connect_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_processed_events: {
        Row: {
          event_type: string
          id: string
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscription_modules: {
        Row: {
          created_at: string
          deleted_at: string | null
          enabled: boolean
          id: string
          location_id: string | null
          module: Database["public"]["Enums"]["module_enum"]
          organization_id: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          enabled?: boolean
          id?: string
          location_id?: string | null
          module: Database["public"]["Enums"]["module_enum"]
          organization_id: string
          price_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          enabled?: boolean
          id?: string
          location_id?: string | null
          module?: Database["public"]["Enums"]["module_enum"]
          organization_id?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_modules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_packages: {
        Row: {
          active: boolean
          billing_cycle: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          included_credits: Json
          name: string
          organization_id: string
          price_cents: number
          service_type: string | null
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          active?: boolean
          billing_cycle?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          included_credits?: Json
          name: string
          organization_id: string
          price_cents?: number
          service_type?: string | null
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          active?: boolean
          billing_cycle?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          included_credits?: Json
          name?: string
          organization_id?: string
          price_cents?: number
          service_type?: string | null
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          deleted_at: string | null
          id: string
          last_payment_date: string | null
          organization_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          deleted_at?: string | null
          id?: string
          last_payment_date?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          deleted_at?: string | null
          id?: string
          last_payment_date?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suites: {
        Row: {
          capacity: number
          created_at: string
          daily_rate_cents: number
          deleted_at: string | null
          id: string
          location_id: string | null
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["suite_status_enum"]
          type: Database["public"]["Enums"]["suite_type_enum"]
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          daily_rate_cents?: number
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["suite_status_enum"]
          type?: Database["public"]["Enums"]["suite_type_enum"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          daily_rate_cents?: number
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["suite_status_enum"]
          type?: Database["public"]["Enums"]["suite_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suites_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rules: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          id: string
          location_id: string | null
          name: string
          organization_id: string
          rate_basis_points: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          name: string
          organization_id: string
          rate_basis_points: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          name?: string
          organization_id?: string
          rate_basis_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_rules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          administered_on: string | null
          created_at: string
          deleted_at: string | null
          document_url: string | null
          expires_on: string | null
          id: string
          notes: string | null
          organization_id: string
          pet_id: string
          updated_at: string
          vaccine_type: Database["public"]["Enums"]["vaccine_type_enum"]
          verified: boolean
          verified_at: string | null
          verified_by_user_id: string | null
          vet_clinic: string | null
          vet_name: string | null
        }
        Insert: {
          administered_on?: string | null
          created_at?: string
          deleted_at?: string | null
          document_url?: string | null
          expires_on?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          pet_id: string
          updated_at?: string
          vaccine_type: Database["public"]["Enums"]["vaccine_type_enum"]
          verified?: boolean
          verified_at?: string | null
          verified_by_user_id?: string | null
          vet_clinic?: string | null
          vet_name?: string | null
        }
        Update: {
          administered_on?: string | null
          created_at?: string
          deleted_at?: string | null
          document_url?: string | null
          expires_on?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          pet_id?: string
          updated_at?: string
          vaccine_type?: Database["public"]["Enums"]["vaccine_type_enum"]
          verified?: boolean
          verified_at?: string | null
          verified_by_user_id?: string | null
          vet_clinic?: string | null
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      waiver_signatures: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          organization_id: string
          owner_id: string
          signature_data: string | null
          signed_at: string
          user_agent: string | null
          waiver_id: string
          waiver_version: number
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          organization_id: string
          owner_id: string
          signature_data?: string | null
          signed_at?: string
          user_agent?: string | null
          waiver_id: string
          waiver_version?: number
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          organization_id?: string
          owner_id?: string
          signature_data?: string | null
          signed_at?: string
          user_agent?: string | null
          waiver_id?: string
          waiver_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "waiver_signatures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_signatures_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_signatures_waiver_id_fkey"
            columns: ["waiver_id"]
            isOneToOne: false
            referencedRelation: "waivers"
            referencedColumns: ["id"]
          },
        ]
      }
      waivers: {
        Row: {
          active: boolean
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          organization_id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "waivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_membership: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["membership_role"]
        }
        Returns: string
      }
      current_org_id: { Args: never; Returns: string }
      decrement_product_stock: {
        Args: {
          _allow_negative?: boolean
          _product_id: string
          _quantity: number
        }
        Returns: undefined
      }
      is_org_admin: { Args: { _org_id: string }; Returns: boolean }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      set_member_active: {
        Args: { _active: boolean; _membership_id: string }
        Returns: undefined
      }
      update_member_role: {
        Args: {
          _membership_id: string
          _new_role: Database["public"]["Enums"]["membership_role"]
        }
        Returns: undefined
      }
    }
    Enums: {
      communication_pref: "email" | "sms" | "both"
      connect_account_type: "standard" | "express" | "custom"
      country_enum: "CA" | "US"
      currency_enum: "CAD" | "USD"
      duration_type_enum:
        | "hourly"
        | "half_day"
        | "full_day"
        | "overnight"
        | "multi_night"
      intake_status_enum:
        | "pending_review"
        | "approved"
        | "restricted"
        | "banned"
      invoice_status: "draft" | "sent" | "paid" | "partial" | "overdue" | "void"
      kennel_run_type: "standard" | "large" | "suite" | "indoor" | "outdoor"
      membership_role: "owner" | "admin" | "manager" | "staff" | "customer"
      message_sender_type: "staff" | "owner"
      module_enum: "daycare" | "boarding" | "grooming" | "training" | "retail"
      org_status_enum: "trial" | "active" | "paused" | "past_due" | "cancelled"
      payment_method_enum: "card" | "ach" | "in_person"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      pet_owner_relationship: "primary" | "secondary" | "emergency_only"
      reservation_source: "staff_created" | "owner_self_serve"
      reservation_status:
        | "requested"
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
        | "no_show"
      sex_enum: "M" | "F" | "U"
      species_enum: "dog" | "cat" | "other"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "paused"
      suite_status_enum: "active" | "inactive"
      suite_type_enum: "standard" | "deluxe" | "presidential"
      vaccine_type_enum:
        | "rabies"
        | "dapp"
        | "dhpp"
        | "bordetella"
        | "lepto"
        | "lyme"
        | "influenza"
        | "fvrcp"
        | "other"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      communication_pref: ["email", "sms", "both"],
      connect_account_type: ["standard", "express", "custom"],
      country_enum: ["CA", "US"],
      currency_enum: ["CAD", "USD"],
      duration_type_enum: [
        "hourly",
        "half_day",
        "full_day",
        "overnight",
        "multi_night",
      ],
      intake_status_enum: [
        "pending_review",
        "approved",
        "restricted",
        "banned",
      ],
      invoice_status: ["draft", "sent", "paid", "partial", "overdue", "void"],
      kennel_run_type: ["standard", "large", "suite", "indoor", "outdoor"],
      membership_role: ["owner", "admin", "manager", "staff", "customer"],
      message_sender_type: ["staff", "owner"],
      module_enum: ["daycare", "boarding", "grooming", "training", "retail"],
      org_status_enum: ["trial", "active", "paused", "past_due", "cancelled"],
      payment_method_enum: ["card", "ach", "in_person"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      pet_owner_relationship: ["primary", "secondary", "emergency_only"],
      reservation_source: ["staff_created", "owner_self_serve"],
      reservation_status: [
        "requested",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
      sex_enum: ["M", "F", "U"],
      species_enum: ["dog", "cat", "other"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "cancelled",
        "paused",
      ],
      suite_status_enum: ["active", "inactive"],
      suite_type_enum: ["standard", "deluxe", "presidential"],
      vaccine_type_enum: [
        "rabies",
        "dapp",
        "dhpp",
        "bordetella",
        "lepto",
        "lyme",
        "influenza",
        "fvrcp",
        "other",
      ],
    },
  },
} as const
