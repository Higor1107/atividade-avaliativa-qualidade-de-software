import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wstxwsdgftpovnztpzus.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LAmXA42Os7U8PMhDVpgFuQ_BQEDKb0p';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
