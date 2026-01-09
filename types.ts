
export interface UserProfile {
  name: string;
  isLoggedIn: boolean;
  notificationFrequency: 'daily' | 'weekly' | 'none';
  notificationTime: string;
}

export interface Theme {
  id: string;
  name: string;
  goal: string;
  createdAt: number;
}

export interface Insight {
  id: string;
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
