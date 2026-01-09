
// このファイルはVercel上で実行されます
import webpush from 'https://esm.sh/web-push@3.6.7';

export default async function handler(req: any, res: any) {
  const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY!,
    privateKey: process.env.VAPID_PRIVATE_KEY!,
  };

  webpush.setVapidDetails(
    'mailto:example@yourdomain.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  // 本来はここでSupabaseからその時間に通知設定しているユーザーを取得
  // const { data: subs } = await supabase.from('push_subscriptions').select('*');
  
  // ダミーの送信処理
  // await webpush.sendNotification(subscription, JSON.stringify({ title: '熟達っつぁん', body: '今日の振り返りをしませんか？' }));

  res.status(200).json({ success: true });
}
