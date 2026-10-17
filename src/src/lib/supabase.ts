import { createClient } from '@supabase/supabase-js';

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://slibenbmosftqyozhyto.supabase.co';
export const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_R5bspy3ytWGVLfvI9sobZA_pTcDYQaz';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
