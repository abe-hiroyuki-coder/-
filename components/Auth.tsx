
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [freq, setFreq] = useState<'daily' | 'weekly' | 'none'>('daily');
  const [time, setTime] = useState('21:00');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin({
        name,
        isLoggedIn: true,
        notificationFrequency: freq,
        notificationTime: time
      });
    }
  };

  const requestNotificationPermission = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('プッシュ通知はこのブラウザではサポートされていません。');
      return;
    }

    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        // 実際にはここで VAPID公開鍵を使って購読を作成し、Supabaseに保存する
        // const subscription = await registration.pushManager.subscribe({...});
        // await saveSubscriptionToSupabase(subscription);
        console.log('Push subscription successful (simulated)');
      }
    } catch (err) {
      console.error('Failed to subscribe to push', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col justify-center space-y-12 bg-indigo-600 text-white">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[40px] flex items-center justify-center text-5xl mx-auto shadow-2xl float-animation">
          🐙
        </div>
        <h1 className="text-3xl font-black tracking-tighter">熟達っつぁんへ、ようこそ</h1>
        <p className="text-indigo-100 text-sm opacity-80">
          気づきを言語化し、思考の地図を育てる。<br/>
          さぁ、あなたの探究を始めましょう。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200">あなたの名前</label>
          <input 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/10 border-b-2 border-white/20 p-3 outline-none focus:border-white transition-all text-xl font-bold"
            placeholder="例：熟達 太郎"
          />
        </div>

        <div className="space-y-4 bg-white/10 p-6 rounded-3xl backdrop-blur-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block mb-2">通知の設定</label>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'none'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => { setFreq(f); if (f !== 'none') requestNotificationPermission(); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  freq === f ? 'bg-white text-indigo-600' : 'bg-white/10 text-white'
                }`}
              >
                {f === 'daily' ? '毎日' : f === 'weekly' ? '週次' : 'なし'}
              </button>
            ))}
          </div>
          {freq !== 'none' && (
            <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-4">
              <span className="text-xs font-bold">通知タイミング</span>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent font-bold outline-none"
              />
            </div>
          )}
        </div>

        <button 
          type="submit"
          disabled={isSubscribing}
          className="w-full bg-white text-indigo-600 p-5 rounded-3xl font-black text-lg shadow-2xl active:scale-95 transition-transform disabled:opacity-50"
        >
          {isSubscribing ? '設定中...' : '熟達の道を開始する'}
        </button>
      </form>
    </div>
  );
};

export default Auth;
