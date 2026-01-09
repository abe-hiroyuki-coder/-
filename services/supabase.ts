import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const getEnv = (key: string) => {
  try {
    // 複数の可能性のあるキー名をチェック
    const env = (globalThis as any).process?.env;
    return env?.[key] || env?.[`NEXT_PUBLIC_${key}`] || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// 初期化に失敗してもモジュール全体がエラーにならないようにラップ
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // ダミーオブジェクト（エラー時のクラッシュ防止）
      from: () => ({
        select: () => Promise.resolve({ data: null, error: new Error('Supabase configuration missing') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase configuration missing') }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase configuration missing') }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase configuration missing') }) })
      }),
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      }
    } as any;