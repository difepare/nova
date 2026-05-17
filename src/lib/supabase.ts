import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Esto es solo para TypeScript, en runtime ya existirán
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env variables:', { supabaseUrl, supabaseAnonKey })
  throw new Error('supabaseUrl is required')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type { Task, Column } from './types' // Asegúrate de tener esto