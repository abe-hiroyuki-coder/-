
import React, { useState, useEffect } from 'react';
import { Theme, AppState } from '../types';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  state: AppState;
  currentTheme: Theme | null;
  addTheme: (name: string, goal: string) => void;
  updateThemeGoal: (id: string, goal: string) => void;
  switchTheme: (id: string) => void;
  addInsight: (body: string, themeId: string) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, currentTheme, addTheme, updateThemeGoal, switchTheme, addInsight, onLogout }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [editGoalValue, setEditGoalValue] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentTheme) {
      setEditGoalValue(currentTheme.goal);
    }
  }, [currentTheme]);

  const handleQuickInsight = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim() && currentTheme) {
      addInsight(quickInput, currentTheme.id);
      setQuickInput('');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const handleSaveGoal = () => {
    if (currentTheme && editGoalValue.trim()) {
      updateThemeGoal(currentTheme.id, editGoalValue);
      setIsEditingGoal(false);
    }
  };

  const handleCreateTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newGoal) {
      addTheme(newName, newGoal);
      setIsAdding(false);
      setNewName('');
      setNewGoal('');
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("お使いのブラウザは音声入力に対応していません。");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setQuickInput(prev => (prev ? prev + ' ' : '') + event.results[0][0].transcript);
    };
    recognition.start();
  };

  return (
    <div className="p-6 pb-24 space-y-8 h-full overflow-y-auto relative">
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2">
          💡 保存しました
        </div>
      )}

      <header className="flex justify-between items-center relative z-20">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">
            こんにちは、<br/>{state.user.name}さん
          </h1>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl float-animation transition-transform active:scale-90"
          >
            🐙
          </button>
          
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-3xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 origin-top-right">
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User ID</p>
                <p className="text-[8px] font-mono text-slate-300 break-all">{state.user.id}</p>
              </div>
              <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                ログアウト 🚪
              </button>
            </div>
          )}
        </div>
      </header>

      {currentTheme && (
        <section className="bg-white p-2 rounded-[32px] border-2 border-slate-100 shadow-sm focus-within:border-indigo-500 transition-all">
          <form onSubmit={handleQuickInsight} className="flex items-center gap-1">
            <input 
              value={quickInput} 
              onChange={(e) => setQuickInput(e.target.value)} 
              placeholder="今のひらめきを記録..." 
              className="flex-1 bg-transparent p-4 text-sm font-medium outline-none" 
            />
            <button 
              type="button" 
              onClick={startVoiceInput} 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              🎤
            </button>
            <button 
              type="submit" 
              disabled={!quickInput.trim()} 
              className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-30 active:scale-90 transition-transform"
            >
              💡
            </button>
          </form>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">現在のテーマ</label>
          <button onClick={() => setIsAdding(true)} className="text-[10px] font-black text-indigo-600 uppercase">+ 新規作成</button>
        </div>
        {state.themes.length > 0 ? (
          <select 
            value={currentTheme?.id || ''} 
            onChange={(e) => switchTheme(e.target.value)} 
            className="w-full p-5 bg-slate-50 rounded-3xl font-black text-lg outline-none ring-indigo-500 focus:ring-2 transition-all appearance-none"
          >
            {state.themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-[40px] text-center bg-slate-50/50 flex flex-col items-center gap-4">
            <p className="text-slate-400 text-xs font-bold">熟達したいことを登録しましょう</p>
            <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">テーマを作成</button>
          </div>
        )}
      </section>

      {currentTheme && (
        <div className="space-y-4">
          <section className="bg-indigo-50/50 p-6 rounded-[40px] border border-indigo-100/50 relative group">
            {isEditingGoal ? (
              <div className="space-y-3">
                <textarea 
                  value={editGoalValue}
                  onChange={(e) => setEditGoalValue(e.target.value)}
                  className="w-full bg-white p-4 rounded-2xl text-slate-800 font-bold outline-none ring-2 ring-indigo-500"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditingGoal(false)} className="text-xs font-bold text-slate-400 px-3 py-1">戻る</button>
                  <button onClick={handleSaveGoal} className="bg-indigo-600 text-white text-xs font-black px-4 py-1 rounded-full shadow-md">目標を保存</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start gap-2">
                <p className="text-slate-700 font-bold leading-relaxed italic text-lg flex-1">「{currentTheme.goal}」</p>
                <button 
                  onClick={() => setIsEditingGoal(true)}
                  className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✏️
                </button>
              </div>
            )}
          </section>
          <button 
            onClick={() => navigate('/chat')} 
            className="w-full bg-slate-900 text-white p-6 rounded-[40px] font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-transform group"
          >
            <span>壁打ちを開始</span>
            <span className="group-hover:translate-x-1 transition-transform">🚀</span>
          </button>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center p-4">
          <form 
            onSubmit={handleCreateTheme}
            className="bg-white w-full p-8 rounded-[48px] shadow-2xl space-y-6 animate-in slide-in-from-bottom-10"
          >
            <h2 className="text-2xl font-black">新しいテーマ</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">テーマ名</label>
                <input autoFocus required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 ring-indigo-500 transition-all" placeholder="例：英語のスピーキング" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">目標</label>
                <textarea required value={newGoal} onChange={(e) => setNewGoal(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-medium focus:ring-2 ring-indigo-500 transition-all" placeholder="どんな状態を目指しますか？" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 p-4 font-bold text-slate-400">キャンセル</button>
              <button 
                type="submit" 
                className="flex-[2] bg-indigo-600 text-white p-4 rounded-3xl font-black shadow-xl active:scale-95 transition-transform"
              >
                テーマを決定
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
