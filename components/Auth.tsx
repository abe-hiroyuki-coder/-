
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [freq, setFreq] = useState<'daily' | 'weekly' | 'none'>('daily');
  const [time, setTime] = useState('21:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsLoading(true);
    try {
      // 1. まずDBにその名前のユーザーがいるか検索
      console.log("アカウント検索中:", trimmedName);
      const { data: existingUsers, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('name', trimmedName);

      if (fetchError) {
        console.error("Fetch Error:", fetchError);
        // テーブルがない場合のエラーメッセージ
        if (fetchError.message.includes("relation") && fetchError.message.includes("does not exist")) {
          throw new Error("Supabaseにテーブルが存在しません。SQL Editorでテーブル作成用SQLを実行してください。");
        }
        throw fetchError;
      }

      let userData: UserProfile;

      if (existingUsers && existingUsers.length > 0) {
        // A. すでにユーザーが存在する場合：そのIDをアプリで利用
        const user = existingUsers[0];
        console.log("既存アカウントが見つかりました:", user.id);
        userData = {
          id: user.id,
          name: user.name,
          isLoggedIn: true,
          notificationFrequency: user.notification_frequency || 'daily',
          notificationTime: user.notification_time || '21:00'
        };
      } else {
        // B. まったく新しいユーザーの場合：新規作成
        const newId = crypto.randomUUID();
        console.log("新規アカウントを作成します:", newId);
        userData = {
          id: newId,
          name: trimmedName,
          isLoggedIn: true,
          notificationFrequency: freq,
          notificationTime: time
        };

        const { error: insertError } = await supabase.from('user_profiles').insert([{
          id: newId,
          name: trimmedName,
          notification_frequency: freq,
          notification_time: time
        }]);
        
        if (insertError) throw insertError;
      }

      // loginを実行。App.tsxでステートがリセットされる
      onLogin(userData);
    } catch (err: any) {
      console.error('Login error:', err);
      alert('エラー: ' + (err.message || '通信に失敗しました。'));
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('このブラウザはプッシュ通知に対応していません。');
      return;
    }
    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKeyRaw = (globalThis as any).process?.env?.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKeyRaw) { alert('VAPIDキーが設定されていません。'); setIsSubscribing(false); return; }
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKeyRaw);
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey });
        await supabase.from('push_subscriptions').insert([{ user_id: name || 'anonymous', subscription: subscription, device_info: navigator.userAgent }]);
        alert('通知設定が完了しました！');
      }
    } catch (err) { console.error('Push error:', err); alert('通知の登録に失敗しました。');
    } finally { setIsSubscribing(false); }
  };

  return (
    <div className="flex-1 flex flex-col p-8 space-y-12 bg-indigo-600 text-white overflow-y-auto min-h-full scroll-container">
      <div className="text-center space-y-4 pt-8">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[40px] flex items-center justify-center text-5xl mx-auto shadow-2xl float-animation">🐙</div>
        <h1 className="text-3xl font-black tracking-tighter">熟達っつぁん</h1>
        <p className="text-indigo-100 text-sm opacity-80 leading-relaxed">あなたの試行錯誤を、知性に変える。</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12 flex-1">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200">ユーザー名</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/10 border-b-2 border-white/20 p-3 outline-none focus:border-white transition-all text-xl font-bold" placeholder="例：熟達 太郎" />
          <p className="text-[10px] text-indigo-200 opacity-60">※同じ名前でログインすると、以前の記録を同期します。</p>
        </div>
        <div className="space-y-4 bg-white/10 p-6 rounded-3xl backdrop-blur-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block mb-2">通知の設定</label>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'none'] as const).map(f => (
              <button key={f} type="button" onClick={() => setFreq(f)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${freq === f ? 'bg-white text-indigo-600' : 'bg-white/10 text-white'}`}>
                {f === 'daily' ? '毎日' : f === 'weekly' ? '週次' : 'なし'}
              </button>
            ))}
          </div>
          {freq !== 'none' && (
            <div className="flex flex-col gap-4 mt-4 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">通知タイミング</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-transparent font-bold outline-none" />
              </div>
              <button type="button" disabled={isSubscribing} onClick={requestNotificationPermission} className="text-[10px] bg-white/20 hover:bg-white/30 py-2 rounded-lg font-black uppercase tracking-tighter transition-colors disabled:opacity-50">
                {isSubscribing ? '登録中...' : 'この端末の通知を許可する 🔔'}
              </button>
            </div>
          )}
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-white text-indigo-600 p-5 rounded-3xl font-black text-lg shadow-2xl active:scale-95 transition-transform disabled:opacity-50">
          {isLoading ? '同期中...' : '熟達の道を開始する'}
        </button>
      </form>
    </div>
  );
};

export default Auth;
