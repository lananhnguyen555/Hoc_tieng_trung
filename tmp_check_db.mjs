import { createClient } from '@supabase/supabase-client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTables() {
  const { data: grammar, error: gError } = await supabase.from('grammar').select('*').limit(1)
  const { data: rules, error: rError } = await supabase.from('rules').select('*').limit(1)

  console.log('Grammar table:', gError ? 'Not found or Error' : 'Ready')
  if (gError) console.log('Grammar Error:', gError.message)
  
  console.log('Rules table:', rError ? 'Not found or Error' : 'Ready')
  if (rError) console.log('Rules Error:', rError.message)
}

checkTables()
