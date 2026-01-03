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
      experiments: {
        Row: {
          id: string
          experiment_number: number
          title: string
          summary: string
          created_at: string
        }
        Insert: {
          id?: string
          experiment_number: number
          title: string
          summary: string
          created_at?: string
        }
        Update: {
          id?: string
          experiment_number?: number
          title?: string
          summary?: string
          created_at?: string
        }
      }
      hypotheses: {
        Row: {
          id: string
          experiment_id: string
          hypothesis: string
          is_validated: boolean
          evidence: string
          surprise_level: 'Low' | 'Medium' | 'High'
          created_at: string
        }
        Insert: {
          id?: string
          experiment_id: string
          hypothesis: string
          is_validated: boolean
          evidence: string
          surprise_level: 'Low' | 'Medium' | 'High'
          created_at?: string
        }
        Update: {
          id?: string
          experiment_id?: string
          hypothesis?: string
          is_validated?: boolean
          evidence?: string
          surprise_level?: 'Low' | 'Medium' | 'High'
          created_at?: string
        }
      }
      insights: {
        Row: {
          id: string
          experiment_id: string
          insight: string
          details: string
          created_at: string
        }
        Insert: {
          id?: string
          experiment_id: string
          insight: string
          details: string
          created_at?: string
        }
        Update: {
          id?: string
          experiment_id?: string
          insight?: string
          details?: string
          created_at?: string
        }
      }
      team_probabilities: {
        Row: {
          id: string
          experiment_id: string
          team_code: string
          team_name: string
          probability: number
          rank: number
          change_from_previous: number | null
          created_at: string
        }
        Insert: {
          id?: string
          experiment_id: string
          team_code: string
          team_name: string
          probability: number
          rank: number
          change_from_previous?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          experiment_id?: string
          team_code?: string
          team_name?: string
          probability?: number
          rank?: number
          change_from_previous?: number | null
          created_at?: string
        }
      }
      next_experiments: {
        Row: {
          id: string
          experiment_id: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          experiment_id: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          experiment_id?: string
          description?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_latest_experiment: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
