import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// process.env が未定義の場合のクラッシュを防止
const getEnv = (key: string) => {
  try {
    return (globalThis as any).process?.env?.[key] || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);