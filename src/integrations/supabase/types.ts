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
    PostgrestVersion: "14.1"
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
      ab_test_results: {
        Row: {
          avg_satisfaction: number | null
          chatbot_id: string | null
          created_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          total_conversations: number | null
          total_messages: number | null
          variant_id: string | null
        }
        Insert: {
          avg_satisfaction?: number | null
          chatbot_id?: string | null
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          total_conversations?: number | null
          total_messages?: number | null
          variant_id?: string | null
        }
        Update: {
          avg_satisfaction?: number | null
          chatbot_id?: string | null
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          total_conversations?: number | null
          total_messages?: number | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_results_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_results_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "chatbot_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          placement: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          placement?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          placement?: string | null
          title?: string | null
        }
        Relationships: []
      }
      agencies: {
        Row: {
          brand_color: string | null
          created_at: string | null
          custom_domain: string | null
          favicon_url: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "agencies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_members: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          provider: string
          supports_vision: boolean | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          provider: string
          supports_vision?: boolean | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          provider?: string
          supports_vision?: boolean | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key: string
          last_used_at: string | null
          name: string
          scopes: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          last_used_at?: string | null
          name: string
          scopes?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          agency_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          agency_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          agency_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_variants: {
        Row: {
          ai_model: string | null
          chatbot_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          system_prompt_override: string | null
          tone: string | null
          traffic_percentage: number | null
          welcome_message: string | null
        }
        Insert: {
          ai_model?: string | null
          chatbot_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          system_prompt_override?: string | null
          tone?: string | null
          traffic_percentage?: number | null
          welcome_message?: string | null
        }
        Update: {
          ai_model?: string | null
          chatbot_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          system_prompt_override?: string | null
          tone?: string | null
          traffic_percentage?: number | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_variants_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          ai_model: string | null
          avatar_emoji: string | null
          created_at: string | null
          embed_token: string | null
          fallback_model: string | null
          id: string
          is_active: boolean | null
          name: string
          primary_color: string | null
          routing_strategy: string | null
          tone: string | null
          total_conversations: number | null
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          ai_model?: string | null
          avatar_emoji?: string | null
          created_at?: string | null
          embed_token?: string | null
          fallback_model?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          primary_color?: string | null
          routing_strategy?: string | null
          tone?: string | null
          total_conversations?: number | null
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          ai_model?: string | null
          avatar_emoji?: string | null
          created_at?: string | null
          embed_token?: string | null
          fallback_model?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          primary_color?: string | null
          routing_strategy?: string | null
          tone?: string | null
          total_conversations?: number | null
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_annotations: {
        Row: {
          annotation: string
          conversation_id: string
          created_at: string | null
          id: string
          message_index: number | null
          user_id: string
        }
        Insert: {
          annotation: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_index?: number | null
          user_id: string
        }
        Update: {
          annotation?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_index?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_annotations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          tag: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          tag: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_transfers: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          from_chatbot_id: string
          id: string
          reason: string | null
          to_chatbot_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          from_chatbot_id: string
          id?: string
          reason?: string | null
          to_chatbot_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          from_chatbot_id?: string
          id?: string
          reason?: string | null
          to_chatbot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_transfers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_transfers_from_chatbot_id_fkey"
            columns: ["from_chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_transfers_to_chatbot_id_fkey"
            columns: ["to_chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          chatbot_id: string
          id: string
          last_message_at: string | null
          messages: Json | null
          session_id: string | null
          started_at: string | null
          variant_id: string | null
          visitor_id: string | null
        }
        Insert: {
          chatbot_id: string
          id?: string
          last_message_at?: string | null
          messages?: Json | null
          session_id?: string | null
          started_at?: string | null
          variant_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          chatbot_id?: string
          id?: string
          last_message_at?: string | null
          messages?: Json | null
          session_id?: string | null
          started_at?: string | null
          variant_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "chatbot_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_settings: {
        Row: {
          agency_id: string
          audit_log_enabled: boolean | null
          created_at: string | null
          data_residency_region: string | null
          fine_tuning_enabled: boolean | null
          fine_tuning_model: string | null
          id: string
          sso_config: Json | null
          sso_enabled: boolean | null
          sso_provider: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          audit_log_enabled?: boolean | null
          created_at?: string | null
          data_residency_region?: string | null
          fine_tuning_enabled?: boolean | null
          fine_tuning_model?: string | null
          id?: string
          sso_config?: Json | null
          sso_enabled?: boolean | null
          sso_provider?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          audit_log_enabled?: boolean | null
          created_at?: string | null
          data_residency_region?: string | null
          fine_tuning_enabled?: boolean | null
          fine_tuning_model?: string | null
          id?: string
          sso_config?: Json | null
          sso_enabled?: boolean | null
          sso_provider?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_settings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_changelog: {
        Row: {
          action: string
          applied_at: string | null
          chatbot_id: string
          faq_id: string | null
          field: string
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          rolled_back_at: string | null
          source: string
        }
        Insert: {
          action: string
          applied_at?: string | null
          chatbot_id: string
          faq_id?: string | null
          field?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          rolled_back_at?: string | null
          source?: string
        }
        Update: {
          action?: string
          applied_at?: string | null
          chatbot_id?: string
          faq_id?: string | null
          field?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          rolled_back_at?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_changelog_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_changelog_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "faqs"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          chatbot_id: string
          created_at: string | null
          embedding: string | null
          id: string
          question: string
          variations: string[] | null
        }
        Insert: {
          answer: string
          chatbot_id: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          question: string
          variations?: string[] | null
        }
        Update: {
          answer?: string
          chatbot_id?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          question?: string
          variations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      flutterwave_events: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          event_type: string
          id: string
          processed: boolean | null
          raw_body: Json | null
          status: string | null
          transaction_id: string | null
          tx_ref: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          event_type: string
          id?: string
          processed?: boolean | null
          raw_body?: Json | null
          status?: string | null
          transaction_id?: string | null
          tx_ref?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          event_type?: string
          id?: string
          processed?: boolean | null
          raw_body?: Json | null
          status?: string | null
          transaction_id?: string | null
          tx_ref?: string | null
        }
        Relationships: []
      }
      follow_up_log: {
        Row: {
          clicked_at: string | null
          conversation_id: string | null
          id: string
          opened_at: string | null
          rule_id: string
          sent_at: string | null
          status: string | null
          visitor_email: string | null
        }
        Insert: {
          clicked_at?: string | null
          conversation_id?: string | null
          id?: string
          opened_at?: string | null
          rule_id: string
          sent_at?: string | null
          status?: string | null
          visitor_email?: string | null
        }
        Update: {
          clicked_at?: string | null
          conversation_id?: string | null
          id?: string
          opened_at?: string | null
          rule_id?: string
          sent_at?: string | null
          status?: string | null
          visitor_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "follow_up_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_rules: {
        Row: {
          chatbot_id: string
          created_at: string | null
          email_body: string | null
          email_subject: string | null
          id: string
          is_active: boolean | null
          name: string | null
          trigger_delay_hours: number | null
          trigger_type: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          trigger_delay_hours?: number | null
          trigger_type: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          trigger_delay_hours?: number | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_rules_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          chatbot_id: string
          config: Json | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_synced_at: string | null
          provider: string
          updated_at: string | null
        }
        Insert: {
          chatbot_id: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_synced_at?: string | null
          provider: string
          updated_at?: string | null
        }
        Update: {
          chatbot_id?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_synced_at?: string | null
          provider?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      lighthouse_scores: {
        Row: {
          accessibility: number | null
          best_practices: number | null
          chatbot_id: string
          created_at: string | null
          id: string
          performance: number | null
          pwa: number | null
          score_json: Json | null
          seo: number | null
          url: string
        }
        Insert: {
          accessibility?: number | null
          best_practices?: number | null
          chatbot_id: string
          created_at?: string | null
          id?: string
          performance?: number | null
          pwa?: number | null
          score_json?: Json | null
          seo?: number | null
          url: string
        }
        Update: {
          accessibility?: number | null
          best_practices?: number | null
          chatbot_id?: string
          created_at?: string | null
          id?: string
          performance?: number | null
          pwa?: number | null
          score_json?: Json | null
          seo?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lighthouse_scores_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      orchestration_rules: {
        Row: {
          chatbot_id: string
          condition_type: string
          condition_value: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          priority: number | null
          target_chatbot_id: string
        }
        Insert: {
          chatbot_id: string
          condition_type: string
          condition_value?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          priority?: number | null
          target_chatbot_id: string
        }
        Update: {
          chatbot_id?: string
          condition_type?: string
          condition_value?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          priority?: number | null
          target_chatbot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orchestration_rules_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orchestration_rules_target_chatbot_id_fkey"
            columns: ["target_chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          announcement_text: string | null
          free_message_limit: number | null
          id: number
          maintenance_mode: boolean | null
          premium_price_monthly: number | null
          updated_at: string | null
        }
        Insert: {
          announcement_text?: string | null
          free_message_limit?: number | null
          id?: number
          maintenance_mode?: boolean | null
          premium_price_monthly?: number | null
          updated_at?: string | null
        }
        Update: {
          announcement_text?: string | null
          free_message_limit?: number | null
          id?: number
          maintenance_mode?: boolean | null
          premium_price_monthly?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          flutterwave_customer_id: string | null
          full_name: string | null
          id: string
          message_limit: number | null
          monthly_message_count: number | null
          payment_customer_id: string | null
          payment_provider: string | null
          payment_status: string | null
          plan: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          flutterwave_customer_id?: string | null
          full_name?: string | null
          id: string
          message_limit?: number | null
          monthly_message_count?: number | null
          payment_customer_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          plan?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          flutterwave_customer_id?: string | null
          full_name?: string | null
          id?: string
          message_limit?: number | null
          monthly_message_count?: number | null
          payment_customer_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          plan?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          chatbot_id: string
          created_at: string | null
          events: string[] | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_sent_at: string | null
          secret: string | null
          url: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sent_at?: string | null
          secret?: string | null
          url: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sent_at?: string | null
          secret?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_rate_limit: {
        Args: {
          _endpoint: string
          _identifier: string
          _max_requests?: number
          _window_seconds?: number
        }
        Returns: boolean
      }
      get_chatbot_by_embed_token: {
        Args: { token: string }
        Returns: {
          avatar_emoji: string
          embed_token: string
          id: string
          is_active: boolean
          name: string
          primary_color: string
          tone: string
          welcome_message: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_message_count: {
        Args: { _user_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      match_faqs: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_chatbot_id?: string
          query_embedding: string
        }
        Returns: {
          answer: string
          chatbot_id: string
          id: string
          question: string
          similarity: number
          variations: string[]
        }[]
      }
      match_recordings: {
        Args: {
          match_count: number
          match_threshold: number
          p_current_id: string
          p_user_id: string
          query_embedding: string
        }
        Returns: {
          id: string
          similarity: number
          title: string
        }[]
      }
      restore_user_profile: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
