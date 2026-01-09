
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

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_insight', title: '初めの一歩', description: '最初の気づきを記録した', icon: '🌱' },
  { id: '10_insights', title: '探究者', description: '10個の気づきを記録した', icon: '🔍' },
  { id: 'first_link', title: 'つながりの発見', description: '気づき同士を初めてリンクさせた', icon: '🔗' },
  { id: 'theme_creator', title: '開拓者', description: '新しいテーマを作成した', icon: '🗺️' },
];

const INITIAL_USER: UserProfile = {
  name: '',
  isLoggedIn: false,
  notificationFrequency: 'daily',
  notificationTime: '21:00'
};

const RouteLogger: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    console.log("📍 Route Changed to:", location.pathname, "| Time:", new Date().toLocaleTimeString());
  }, [location]);
  return null;
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

  useEffect(() => {
    localStorage.setItem('jukutatsu_state', JSON.stringify(state));
  }, [state]);

  const currentTheme = useMemo(() => 
    state.themes.find(t => t.id === state.currentThemeId) || null
  , [state.themes, state.currentThemeId]);

  const login = useCallback((userData: UserProfile) => {
    setState(prev => ({ ...prev, user: { ...userData, isLoggedIn: true } }));
  }, []);

  const addTheme = useCallback((name: string, goal: string) => {
    const newTheme: Theme = { id: crypto.randomUUID(), name, goal, createdAt: Date.now() };
    setState(prev => ({
      ...prev,
      themes: [...prev.themes, newTheme],
      currentThemeId: newTheme.id,
      achievements: prev.achievements.map(a => 
        a.id === 'theme_creator' && !a.unlockedAt ? { ...a, unlockedAt: Date.now() } : a
      )
    }));
  }, []);

  const updateThemeGoal = useCallback((id: string, goal: string) => {
    setState(prev => ({
      ...prev,
      themes: prev.themes.map(t => t.id === id ? { ...t, goal } : t)
    }));
  }, []);

  const switchTheme = useCallback((id: string) => {
    setState(prev => ({ ...prev, currentThemeId: id, activeChatMessages: [] }));
  }, []);

  const addInsight = useCallback((body: string, themeId: string, sessionId?: string) => {
    if (!themeId) return;
    const newInsight: Insight = {
      id: crypto.randomUUID(),
      themeId,
      body,
      createdAt: Date.now(),
      sessionId,
      linkedToIds: []
    };
    setState(prev => {
      const newInsights = [...prev.insights, newInsight];
      let newAchievements = [...prev.achievements];
      if (newInsights.length === 1) newAchievements = newAchievements.map(a => a.id === 'first_insight' ? { ...a, unlockedAt: Date.now() } : a);
      if (newInsights.length === 10) newAchievements = newAchievements.map(a => a.id === '10_insights' ? { ...a, unlockedAt: Date.now() } : a);
      return { ...prev, insights: newInsights, achievements: newAchievements };
    });
  }, []);

  const deleteInsight = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.filter(i => i.id !== id).map(i => ({
        ...i, linkedToIds: i.linkedToIds.filter(lid => lid !== id)
      }))
    }));
  }, []);

  const updateInsight = useCallback((id: string, newBody: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.map(i => i.id === id ? { ...i, body: newBody } : i)
    }));
  }, []);

  const linkInsights = useCallback((id1: string, id2: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.map(ins => {
        if (ins.id === id1 && !ins.linkedToIds.includes(id2)) return { ...ins, linkedToIds: [...ins.linkedToIds, id2] };
        if (ins.id === id2 && !ins.linkedToIds.includes(id1)) return { ...ins, linkedToIds: [...ins.linkedToIds, id1] };
        return ins;
      }),
      achievements: prev.achievements.map(a => 
        a.id === 'first_link' && !a.unlockedAt ? { ...a, unlockedAt: Date.now() } : a
      )
    }));
  }, []);

  // Update setChatMessages to handle functional updates
  const setChatMessages = useCallback((update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setState(prev => {
      const nextMessages = typeof update === 'function' ? update(prev.activeChatMessages) : update;
      if (JSON.stringify(prev.activeChatMessages) === JSON.stringify(nextMessages)) return prev;
      return { ...prev, activeChatMessages: nextMessages };
    });
  }, []);

  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, activeChatMessages: [] }));
  }, []);

  return (
    <HashRouter>
      <RouteLogger />
      <div className="relative h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden flex flex-col">
        <main className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/login" element={state.user.isLoggedIn ? <Navigate to="/" /> : <Auth onLogin={login} />} />
            <Route path="/" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <Dashboard state={state} currentTheme={currentTheme} addTheme={addTheme} updateThemeGoal={updateThemeGoal} switchTheme={switchTheme} addInsight={addInsight} />} />
            <Route path="/chat" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <ChatSession currentTheme={currentTheme} addInsight={addInsight} persistedMessages={state.activeChatMessages} setPersistedMessages={setChatMessages} clearPersistedMessages={clearChat} />} />
            <Route path="/insights" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <InsightList insights={state.insights.filter(i => i.themeId === state.currentThemeId)} allInsights={state.insights} linkInsights={linkInsights} deleteInsight={deleteInsight} updateInsight={updateInsight} />} />
            <Route path="/graph" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <InsightGraph insights={state.insights.filter(i => i.themeId === state.currentThemeId)} />} />
            <Route path="/review" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <WeeklyReview insights={state.insights.filter(i => i.themeId === state.currentThemeId)} theme={currentTheme} />} />
            <Route path="/achievements" element={!state.user.isLoggedIn ? <Navigate to="/login" /> : <AchievementBadges achievements={state.achievements} />} />
          </Routes>
        </main>
        
        {state.user.isLoggedIn && (
          <nav 
            className="relative z-[9999] h-16 shrink-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 pointer-events-auto shadow-[0_-1px_10px_rgba(0,0,0,0.05)]"
          >
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
    <Link 
      to={to} 
      className={`flex flex-col items-center gap-1 transition-all py-1 px-4 active:scale-95 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{label}</span>
    </Link>
  );
};

export default App;
