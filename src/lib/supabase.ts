import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Create the client even if keys are placeholders to avoid crashing on import.
// Real calls will fail, which we handle in our data fetching logic.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
