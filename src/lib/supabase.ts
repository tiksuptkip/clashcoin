import { createClient } from '@supabase/supabase-js';

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://wrdrozkcqfmdzluzwrbz.supabase.co';

export const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_CUaXE0-7Nun_Vappy9baJQ_pLIxjbTM';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
