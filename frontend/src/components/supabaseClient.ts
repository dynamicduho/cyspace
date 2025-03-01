import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lahunnoxepttqdlyfsnf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaHVubm94ZXB0dHFkbHlmc25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3OTU2NzEsImV4cCI6MjA1NjM3MTY3MX0.lRw62UGO9D7UqkGiKdBWWy_X1bo6oRLjnURMHAVD8mo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)