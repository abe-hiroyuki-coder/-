
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

// 堅牢なID生成器
const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

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
    if (saved) {
      const parsed = JSON.parse(saved);
      // 旧バージョンからの移行：IDがない場合は付与
      if (parsed.user && parsed.user.isLoggedIn && !parsed.user.id) {
        parsed.user.id = generateId();
      }
      return parsed;
    }
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

  // データ同期
  useEffect(() => {
    const fetchData = async () => {
      if (!state.user.isLoggedIn || !state.user.id) return;

      try {
        const { data: themes } = await supabase.from('themes').select('*').eq('user_id', state.user.id);
        const { data: insights } = await supabase.from('insights').select('*').eq('user_id', state.user.id);

        setState(prev => ({
          ...prev,
          themes: themes && themes.length > 0 ? themes.map((t: any) => ({ ...t, createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now() })) : prev.themes,
          insights: insights && insights.length > 0 ? insights.map((i: any) => ({ 
            id: i.id, 
            user_id: i.user_id,
            themeId: i.theme_id, 
            body: i.body, 
            createdAt: i.created_at ? new Date(i.created_at).getTime() : Date.now(), 
            linkedToIds: i.linked_to_ids || [] 
          })) : prev.insights,
          currentThemeId: prev.currentThemeId || (themes && themes.length > 0 ? themes[0].id : null)
        }));
      } catch (err) {
        console.warn("Supabase Fetch Error:", err);
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
    if (confirm("ログアウトしますか？")) {
      setState(prev => ({ ...prev, user: { ...INITIAL_USER, isLoggedIn: false } }));
    }
  }, []);

  const addTheme = useCallback(async (name: string, goal: string) => {
    if (!state.user.id) {
      console.error("Theme creation failed: user.id is missing");
      return;
    }
    
    const newThemeId = generateId();
    const now = Date.now();
    const newTheme: Theme = { 
      id: newThemeId, 
      user_id: state.user.id, 
      name, 
      goal,
      createdAt: now
    };

    // 1. ローカルに即時反映（UIの反応を最優先）
    setState(prev => ({
      ...prev,
      themes: [...prev.themes, newTheme],
      currentThemeId: newThemeId
    }));

    // 2. サーバー同期（非同期）
    try {
      await supabase.from('themes').insert([{
        id: newThemeId,
        user_id: state.user.id,
        name,
        goal,
        created_at: new Date(now).toISOString()
      }]);
    } catch (err) {
      console.error("Supabase theme insert error:", err);
    }
  }, [state.user.id]);

  const updateThemeGoal = useCallback(async (id: string, goal: string) => {
    setState(prev => ({
      ...prev,
      themes: prev.themes.map(t => t.id === id ? { ...t, goal } : t)
    }));
    await supabase.from('themes').update({ goal }).eq('id', id);
  }, []);

  const switchTheme = useCallback((id: string) => {
    setState(prev => ({ ...prev, currentThemeId: id, activeChatMessages: [] }));
  }, []);

  const addInsight = useCallback(async (body: string, themeId: string, sessionId?: string) => {
    if (!themeId || !state.user.id) return;
    const newInsightId = generateId();
    const now = Date.now();
    
    const newInsight: Insight = { 
      id: newInsightId, 
      user_id: state.user.id,
      themeId, 
      body, 
      createdAt: now, 
      linkedToIds: [],
      sessionId
    };

    setState(prev => ({
      ...prev,
      insights: [...prev.insights, newInsight]
    }));

    await supabase.from('insights').insert([{
      id: newInsightId,
      user_id: state.user.id,
      theme_id: themeId,
      body,
      linked_to_ids: [],
      created_at: new Date(now).toISOString()
    }]);
  }, [state.user.id]);

  const deleteInsight = useCallback(async (id: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.filter(i => i.id !== id)
    }));
    await supabase.from('insights').delete().eq('id', id);
  }, []);

  const updateInsight = useCallback(async (id: string, body: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.map(i => i.id === id ? { ...i, body } : i)
    }));
    await supabase.from('insights').update({ body }).eq('id', id);
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
      <div className="flex flex-col h-full w-full max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
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
          <nav className="shrink-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] pb-safe h-[calc(4rem+env(safe-area-inset-bottom))]">
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
    <Link to={to} className={`flex flex-col items-center gap-1 transition-all py-2 px-4 active:scale-95 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{label}</span>
    </Link>
  );
};

export default App;
