
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import webpush from 'https://esm.sh/web-push@3.6.7';

export default async function handler(req: any, res: any) {
  // 環境変数の取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('ERROR: VAPID keys are not configured in environment variables.');
    return res.status(500).json({ error: 'VAPID keys missing. Please check Vercel settings.' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    webpush.setVapidDetails(
      'mailto:support@jukutatsu.example.com',
      vapidPublicKey,
      vapidPrivateKey
    );
  } catch (err) {
    console.error('ERROR: Failed to set VAPID details. Keys might be invalid.', err);
    return res.status(500).json({ error: 'Invalid VAPID keys.' });
  }

  // 現在の日本時間 (JST) を取得
  const now = new Date();
  const jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const currentHour = jstNow.getUTCHours();
  const currentMinute = jstNow.getUTCMinutes();
  
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
  
  console.log(`Checking notifications for: ${currentTimeStr}`);

  try {
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, name, notification_time')
      .eq('notification_frequency', 'daily');

    if (profileError) throw profileError;

    const targetProfiles = profiles.filter(p => {
      if (!p.notification_time) return false;
      const [h, m] = p.notification_time.split(':').map(Number);
      const profileMinutes = h * 60 + m;
      const currentMinutes = currentHour * 60 + currentMinute;
      return Math.abs(currentMinutes - profileMinutes) < 15;
    });

    if (targetProfiles.length === 0) {
      return res.status(200).json({ message: 'No users to notify at this time.' });
    }

    const results = [];
    for (const profile of targetProfiles) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', profile.name);

      if (subs) {
        for (const s of subs) {
          try {
            await webpush.sendNotification(
              s.subscription,
              JSON.stringify({
                title: '熟達っつぁん',
                body: `${profile.name}さん、今日の気づきを振り返りませんか？`,
              })
            );
            results.push({ user: profile.name, status: 'sent' });
          } catch (err) {
            console.error(`Failed for ${profile.name}:`, err);
            results.push({ user: profile.name, status: 'failed' });
          }
        }
      }
    }

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Push Error:', error);
    res.status(500).json({ error: error.message });
  }
}
