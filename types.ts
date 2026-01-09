
export interface UserProfile {
  id: string; // 内部的な一意ID
  name: string;
  isLoggedIn: boolean;
  notificationFrequency: 'daily' | 'weekly' | 'none';
  notificationTime: string;
}

export interface Theme {
  id: string;
  user_id: string; // 所有者ID
  name: string;
  goal: string;
  createdAt: number;
}

export interface Insight {
  id: string;
  user_id: string; // 所有者ID
  themeId: string;
  body: string;
  createdAt: number;
  sessionId?: string;
  linkedToIds: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface Session {
  id: string;
  themeId: string;
  user_id: string; // 所有者ID
  messages: ChatMessage[];
  startTime: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: number;
  icon: string;
}

export interface AppState {
  user: UserProfile;
  themes: Theme[];
  currentThemeId: string | null;
  insights: Insight[];
  achievements: Achievement[];
  sessions: Session[];
  activeChatMessages: ChatMessage[]; 
}
