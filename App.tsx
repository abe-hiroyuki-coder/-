
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { Theme, Insight, Achievement, AppState, UserProfile, ChatMessage } from './types';
import Dashboard from './components/Dashboard';
import ChatSession from './components/ChatSession';
import InsightList from './components/InsightList';
import InsightGraph from './components/InsightGraph';
import WeeklyReview from './components/WeeklyReview';
import AchievementBadges from './components/AchievementBadges';
import Auth from './components/Auth';
import { supabase } from './services/supabase';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_insight', title: '初めの一歩', description: '最初の気づきを記録した', icon: '🌱' },
  { id: '10_insights', title: '探究者', description: '10個の気づきを記録した', icon: '🔍' },
  { id: 'first_link', title: 'つながりの発見', description: '気づき同士を初めてリンクさせた', icon: '🔗' },
  { id: 'theme_creator', title: '開拓者', description: '新しいテーマを作成した', icon: '🗺️' },
];

const INITIAL_USER: UserProfile = {
  id: '',
  name: '',
  isLoggedIn: false,
  notificationFrequency: 'daily',
  notificationTime: '21:00'
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('jukutatsu_state');
    if (saved) return JSON.parse(saved);
    return {
      user: INITIAL_USER,
      themes: [],
      currentThemeId: null,
      insights: [],
      achievements: INITIAL_ACHIEVEMENTS,
      sessions: [],
      activeChatMessages: []
    };
  });

  // 起動時およびユーザーログイン時にSupabaseから自分のデータのみ読み込む
  useEffect(() => {
    const fetchData = async () => {
      if (!state.user.isLoggedIn || !state.user.id) return;

      try {
        const { data: themes } = await supabase.from('themes').select('*').eq('user_id', state.user.id);
        const { data: insights } = await supabase.from('insights').select('*').eq('user_id', state.user.id);

        setState(prev => ({
          ...prev,
          themes: themes && themes.length > 0 ? themes.map((t: any) => ({ ...t, createdAt: t.created_at || Date.now() })) : prev.themes,
          insights: insights && insights.length > 0 ? insights.map((i: any) => ({ 
            id: i.id, 
            user_id: i.user_id,
            themeId: i.theme_id, 
            body: i.body, 
            createdAt: i.created_at || Date.now(), 
            linkedToIds: i.linked_to_ids || [] 
          })) : prev.insights,
          currentThemeId: prev.currentThemeId || (themes && themes.length > 0 ? themes[0].id : null)
        }));
      } catch (err) {
        console.warn("Supabase Fetch Warning (Local state will be used):", err);
      }
    };
    fetchData();
  }, [state.user.isLoggedIn, state.user.id]);

  useEffect(() => {
    localStorage.setItem('jukutatsu_state', JSON.stringify(state));
  }, [state]);

  const currentTheme = useMemo(() => 
    state.themes.find(t => t.id === state.currentThemeId) || null
  , [state.themes, state.currentThemeId]);

  const login = useCallback((userData: UserProfile) => {
    setState(prev => ({ ...prev, user: { ...userData, isLoggedIn: true } }));
  }, []);

  const logout = useCallback(() => {
    if (confirm("ログアウトしますか？（ブラウザのデータは保持されます）")) {
      setState(prev => ({ ...prev, user: { ...INITIAL_USER, isLoggedIn: false } }));
    }
  }, []);

  const addTheme = useCallback(async (name: string, goal: string) => {
    if (!state.user.id) return;
    const newThemeId = crypto.randomUUID();
    const newThemeData = { 
      id: newThemeId, 
      user_id: state.user.id, 
      name, 
      goal 
    };

    // 楽観的にStateを即座に更新する
    setState(prev => ({
      ...prev,
      themes: [...prev.themes, { ...newThemeData, createdAt: Date.now() }],
      currentThemeId: newThemeId
    }));

    // バックグラウンドで同期
    const { error } = await supabase.from('themes').insert([{
      ...newThemeData,
      created_at: new Date().toISOString()
    }]);
    
    if (error) {
      console.error("Supabase Sync Error:", error);
      // 通信エラーでもLocalStorageにあるので、ユーザーには影響させない
    }
  }, [state.user.id]);

  const updateThemeGoal = useCallback(async (id: string, goal: string) => {
    // 即時反映
    setState(prev => ({
      ...prev,
      themes: prev.themes.map(t => t.id === id ? { ...t, goal } : t)
    }));

    const { error } = await supabase.from('themes').update({ goal }).eq('id', id);
    if (error) console.error(error);
  }, []);

  const switchTheme = useCallback((id: string) => {
    setState(prev => ({ ...prev, currentThemeId: id, activeChatMessages: [] }));
  }, []);

  const addInsight = useCallback(async (body: string, themeId: string, sessionId?: string) => {
    if (!themeId || !state.user.id) return;
    const newInsightId = crypto.randomUUID();
    const newInsightData = {
      id: newInsightId,
      user_id: state.user.id,
      theme_id: themeId,
      body,
      linked_to_ids: []
    };

    // 即時反映
    setState(prev => ({
      ...prev,
      insights: [...prev.insights, { 
        id: newInsightId, 
        user_id: state.user.id,
        themeId, 
        body, 
        createdAt: Date.now(), 
        linkedToIds: [],
        sessionId
      }]
    }));

    const { error } = await supabase.from('insights').insert([{
      ...newInsightData,
      created_at: new Date().toISOString()
    }]);

    if (error) console.error(error);
  }, [state.user.id]);

  const deleteInsight = useCallback(async (id: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.filter(i => i.id !== id)
    }));
    const { error } = await supabase.from('insights').delete().eq('id', id);
    if (error) console.error(error);
  }, []);

  const updateInsight = useCallback(async (id: string, body: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.map(i => i.id === id ? { ...i, body } : i)
    }));
    const { error } = await supabase.from('insights').update({ body }).eq('id', id);
    if (error) console.error(error);
  }, []);

  const linkInsights = useCallback(async (id1: string, id2: string) => {
    const ins1 = state.insights.find(i => i.id === id1);
    const ins2 = state.insights.find(i => i.id === id2);
    if (!ins1 || !ins2) return;

    const newLinks1 = Array.from(new Set([...ins1.linkedToIds, id2]));
    const newLinks2 = Array.from(new Set([...ins2.linkedToIds, id1]));

    setState(prev => ({
      ...prev,
      insights: prev.insights.map(ins => {
        if (ins.id === id1) return { ...ins, linkedToIds: newLinks1 };
        if (ins.id === id2) return { ...ins, linkedToIds: newLinks2 };
        return ins;
      })
    }));

    await supabase.from('insights').update({ linked_to_ids: newLinks1 }).eq('id', id1);
    await supabase.from('insights').update({ linked_to_ids: newLinks2 }).eq('id', id2);
  }, [state.insights]);

  const setChatMessages = useCallback((update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setState(prev => ({
      ...prev,
      activeChatMessages: typeof update === 'function' ? update(prev.activeChatMessages) : update
    }));
  }, []);

  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, activeChatMessages: [] }));
  }, []);

  return (
    <HashRouter>
      {/* 
        h-[100dvh] でモバイルのアドレスバーを除いた動的な高さを確保 
        fixed inset-0 で画面全体に固定し、レイアウト崩れを防ぐ
      */}
      <div className="fixed inset-0 max-w-md mx-auto bg-white shadow-xl flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/login" element={state.user.isLoggedIn ? <Navigate to="/" /> : <Auth onLogin={login} />} />
            <Route path="/" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <Dashboard state={state} currentTheme={currentTheme} addTheme={addTheme} updateThemeGoal={updateThemeGoal} switchTheme={switchTheme} addInsight={addInsight} onLogout={logout} />} />
            <Route path="/chat" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <ChatSession currentTheme={currentTheme} addInsight={addInsight} persistedMessages={state.activeChatMessages} setPersistedMessages={setChatMessages} clearPersistedMessages={clearChat} />} />
            <Route path="/insights" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <InsightList insights={state.insights.filter(i => i.themeId === state.currentThemeId)} allInsights={state.insights} linkInsights={linkInsights} deleteInsight={deleteInsight} updateInsight={updateInsight} />} />
            <Route path="/graph" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <InsightGraph insights={state.insights.filter(i => i.themeId === state.currentThemeId)} />} />
            <Route path="/review" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <WeeklyReview insights={state.insights.filter(i => i.themeId === state.currentThemeId)} theme={currentTheme} />} />
            <Route path="/achievements" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <AchievementBadges achievements={state.achievements} />} />
          </Routes>
        </main>
        
        {state.user.isLoggedIn && (
          <nav className="relative z-[9999] h-16 shrink-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 pointer-events-auto shadow-[0_-1px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
            <NavLink to="/" icon="🏠" label="ホーム" />
            <NavLink to="/chat" icon="💬" label="壁打ち" />
            <NavLink to="/insights" icon="💡" label="気づき" />
            <NavLink to="/graph" icon="🕸️" label="地図" />
            <NavLink to="/achievements" icon="🏆" label="実績" />
          </nav>
        )}
      </div>
    </HashRouter>
  );
};

const NavLink: React.FC<{ to: string, icon: string, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 transition-all py-1 px-4 active:scale-95 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{label}</span>
    </Link>
  );
};

export default App;
