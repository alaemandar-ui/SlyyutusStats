import { 
  ChannelStats, 
  KickUser, 
  LeagueSeason, 
  LeagueRankingEntry, 
  StreamVod, 
  ChatMessage, 
  PointRule, 
  SystemLog, 
  UserProfileData, 
  MyStatsResponse, 
  KickUserSearchResult, 
  VodChatterRanking, 
  AdminOverviewData, 
  Badge 
} from '../types';

const API_BASE = '/api';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string): void {
  try {
    localStorage.setItem('auth_token', token);
  } catch {}
}

export function removeStoredAuthToken(): void {
  try {
    localStorage.removeItem('auth_token');
  } catch {}
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include'
  });
}

export async function fetchChannelStats(): Promise<ChannelStats> {
  const res = await apiFetch(`${API_BASE}/channel/stats`);
  if (!res.ok) throw new Error('Failed to fetch channel stats');
  const data = await res.json();
  return data.channel;
}

export async function fetchChannelHistory(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/channel/history`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.history || [];
}

export async function fetchCurrentLeague(query?: string, limit: number = 25, offset: number = 0): Promise<{
  season: LeagueSeason;
  rankings: LeagueRankingEntry[];
  total: number;
  topThree: LeagueRankingEntry[];
}> {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  const res = await fetch(`${API_BASE}/league/current?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch current league');
  const data = await res.json();
  return {
    season: data.season,
    rankings: data.rankings || [],
    total: data.total || (data.rankings ? data.rankings.length : 0),
    topThree: data.topThree || (data.rankings ? data.rankings.slice(0, 3) : [])
  };
}

export async function fetchSeasons(): Promise<LeagueSeason[]> {
  const res = await fetch(`${API_BASE}/league/seasons`);
  if (!res.ok) throw new Error('Failed to fetch seasons');
  const data = await res.json();
  return data.seasons || [];
}

export async function fetchSeasonDetail(seasonId: string, query?: string, limit: number = 25, offset: number = 0): Promise<{
  season: LeagueSeason;
  rankings: LeagueRankingEntry[];
  total: number;
  topThree: LeagueRankingEntry[];
}> {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  const res = await fetch(`${API_BASE}/league/season/${encodeURIComponent(seasonId)}?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch season ${seasonId}`);
  const data = await res.json();
  return {
    season: data.season,
    rankings: data.rankings || [],
    total: data.total || (data.rankings ? data.rankings.length : 0),
    topThree: data.topThree || (data.rankings ? data.rankings.slice(0, 3) : [])
  };
}

export async function searchUsers(query: string = '', limit: number = 20, offset: number = 0): Promise<KickUserSearchResult[]> {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  const res = await fetch(`${API_BASE}/users/search?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to search users');
  const data = await res.json();
  return data.users || [];
}

export async function fetchUserProfile(username: string): Promise<UserProfileData> {
  const res = await fetch(`${API_BASE}/user/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error(`User ${username} not found`);
  const data = await res.json();
  return {
    user: data.user,
    currentSeasonRank: data.currentSeasonRank ?? null,
    currentSeasonPoints: data.currentSeasonPoints ?? 0,
    currentSeasonMessages: data.currentSeasonMessages ?? 0,
    currentSeasonSubs: data.currentSeasonSubs ?? 0,
    currentSeasonGifts: data.currentSeasonGifts ?? 0,
    seasonHistory: data.seasonHistory || data.historicalRankings || [],
    badges: data.badges || data.earnedBadges || [],
    vodParticipation: data.vodParticipation || [],
    recentMessages: data.recentMessages || []
  };
}

export async function fetchUserChatHistory(kickUserId: string, limit: number = 30, offset: number = 0): Promise<{
  messages: ChatMessage[];
  total: number;
}> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`${API_BASE}/user/${encodeURIComponent(kickUserId)}/messages?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch user messages');
  const data = await res.json();
  return {
    messages: data.messages || [],
    total: data.total ?? (data.messages ? data.messages.length : 0)
  };
}

export async function fetchMyStats(): Promise<MyStatsResponse> {
  const res = await apiFetch(`${API_BASE}/user/me/stats`);
  if (!res.ok) throw new Error('Failed to fetch personal stats');
  const data = await res.json();
  return {
    ...data,
    badges: data.badges || data.earnedBadges || [],
    recentChats: data.recentChats || data.recentMessages || []
  };
}

export async function fetchVods(limit: number = 12, offset: number = 0): Promise<{
  streams: StreamVod[];
  total: number;
}> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await apiFetch(`${API_BASE}/vods?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch streams');
  const data = await res.json();
  return {
    streams: data.streams || [],
    total: data.total ?? (data.streams ? data.streams.length : 0)
  };
}

export async function fetchVodDetail(streamId: string): Promise<{
  stream: StreamVod;
  rankings: VodChatterRanking[];
  totalChatters: number;
  chatMessages: ChatMessage[];
  totalMessages: number;
  subscribers?: {
    kickUserId: string;
    username: string;
    avatarUrl: string;
    type: string;
    timestamp: string;
  }[];
}> {
  const res = await apiFetch(`${API_BASE}/vod/${encodeURIComponent(streamId)}`);
  if (!res.ok) throw new Error(`Stream ${streamId} not found`);
  const data = await res.json();
  return {
    stream: {
      ...data.stream,
      subscribers: data.subscribers || []
    },
    rankings: data.chatterRankings || data.rankings || [],
    totalChatters: data.totalChatters || 0,
    chatMessages: data.chatMessages || [],
    totalMessages: data.totalMessages || 0,
    subscribers: data.subscribers || []
  };
}

export async function fetchVodChat(streamId: string, limit: number = 100, offset: number = 0): Promise<{
  messages: ChatMessage[];
  total: number;
  streamId: string;
}> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await apiFetch(`${API_BASE}/vod/${encodeURIComponent(streamId)}/chat?${params.toString()}`);
  if (!res.ok) return { messages: [], total: 0, streamId };
  return await res.json();
}

export async function fetchAuthMe(): Promise<{
  isAuthenticated: boolean;
  user: any;
  isAdmin: boolean;
}> {
  const res = await apiFetch(`${API_BASE}/auth/me`);
  if (!res.ok) return { isAuthenticated: false, user: null, isAdmin: false };
  return await res.json();
}

export async function demoLogin(asRole: 'admin' | 'user' = 'user', customUsername?: string): Promise<any> {
  const res = await apiFetch(`${API_BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asRole, customUsername })
  });
  if (!res.ok) throw new Error('Login failed');
  return await res.json();
}

export async function logout(): Promise<void> {
  removeStoredAuthToken();
  await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
}

export async function getKickAuthUrl(): Promise<{ authUrl: string; isConfigured: boolean }> {
  const res = await fetch(`${API_BASE}/auth/kick/login`);
  return await res.json();
}

// Admin API
export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  const [rulesRes, statsRes, seasonsRes, logsRes, usersRes] = await Promise.all([
    fetch(`${API_BASE}/admin/point-rules`),
    fetch(`${API_BASE}/channel/stats`),
    fetch(`${API_BASE}/league/seasons`),
    fetch(`${API_BASE}/admin/logs`),
    fetch(`${API_BASE}/users/search?limit=15`)
  ]);

  const rulesData = await rulesRes.json();
  const statsData = await statsRes.json();
  const seasonsData = await seasonsRes.json();
  const logsData = await logsRes.json();
  const usersData = await usersRes.json();

  const activeSeason = (seasonsData.seasons || []).find((s: any) => s.isActive) || {
    seasonId: '09-26',
    name: 'September 2026',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    isActive: true,
    totalPointsDistributed: 0,
    totalParticipants: 0
  };

  const pointRulesDict: Record<string, number> = {};
  (rulesData.rules || []).forEach((r: any) => {
    pointRulesDict[r.ruleKey] = r.pointValue;
  });

  return {
    channel: statsData.channel,
    activeSeason,
    pointRules: pointRulesDict,
    totalUsers: usersData.total || 0,
    recentUsers: usersData.users || [],
    badgesCatalog: [
      { badgeId: 'season_1st', title: 'Season Champion', description: '1st Place in Monthly League', iconType: 'trophy', badgeTier: 'gold', permanent: true },
      { badgeId: 'season_2nd', title: 'Season Runner-Up', description: '2nd Place in Monthly League', iconType: 'medal', badgeTier: 'silver', permanent: true },
      { badgeId: 'season_3rd', title: 'Season Bronze', description: '3rd Place in Monthly League', iconType: 'award', badgeTier: 'bronze', permanent: true },
      { badgeId: 'vod_mvp', title: 'Stream MVP', description: 'Top chatter in a single stream', iconType: 'flame', badgeTier: 'flame', permanent: true },
      { badgeId: 'kingdom_supporter', title: 'Kingdom Supporter', description: 'Subscribed or gifted subs to channel', iconType: 'crown', badgeTier: 'diamond', permanent: true },
      { badgeId: 'veteran_chatter', title: 'Veteran Chatter', description: 'Over 1,000 recorded chat messages', iconType: 'shield', badgeTier: 'gold', permanent: true }
    ],
    systemLogs: logsData.logs || []
  };
}

export async function updateAdminPointRules(rules: Record<string, number>): Promise<void> {
  for (const [ruleKey, pointValue] of Object.entries(rules)) {
    await apiFetch(`${API_BASE}/admin/point-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleKey, pointValue })
    });
  }
}

export async function finalizeSeason(seasonId: string): Promise<any> {
  const res = await apiFetch(`${API_BASE}/admin/finalize-season`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seasonId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to finalize season');
  }
  return await res.json();
}

export async function updateAdminUserPoints(kickUserId: string, pointsAdjustment: number, reason?: string): Promise<any> {
  const res = await apiFetch(`${API_BASE}/admin/adjust-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kickUserId, pointsAdjustment, reason })
  });
  if (!res.ok) throw new Error('Failed to adjust points');
  return await res.json();
}

export async function awardAdminBadge(kickUserId: string, badgeCode: string): Promise<any> {
  const res = await apiFetch(`${API_BASE}/admin/award-badge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kickUserId, badgeCode })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to award badge');
  }
  return await res.json();
}

export async function revokeAdminBadge(awardId: string): Promise<any> {
  const res = await apiFetch(`${API_BASE}/admin/revoke-badge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ awardId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to revoke badge');
  }
  return await res.json();
}

export async function fetchAwardedBadges(): Promise<any[]> {
  const res = await apiFetch(`${API_BASE}/admin/badges/awarded`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.awarded || [];
}

export async function recalculateVodSubs(): Promise<any> {
  const res = await apiFetch(`${API_BASE}/admin/recalculate-vod-subs`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to recalculate VOD subscriptions');
  return await res.json();
}

export async function fetchBadgesCatalog(): Promise<Badge[]> {
  const res = await apiFetch(`${API_BASE}/badges`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.badges || [];
}

// Mini-games API
export interface MiniGameDashboardData {
  status: string;
  totalPlayers: number;
  totalGamesPlayed: number;
  totalWins: number;
  highestScore: number;
  fastestCompletionTime: number;
  recentResults: Array<{
    id: string;
    gameId: string;
    gameTitle?: string;
    userId: string;
    username: string;
    avatarUrl: string;
    score: number;
    timeSeconds: number;
    accuracy?: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    gameMode?: string;
    success: boolean;
    createdAt: string;
  }>;
  perGameStats: Array<{
    gameId: string;
    title: string;
    category: string;
    description: string;
    totalPlays: number;
    totalWins: number;
    highestScore: number;
    fastestTime: number;
    averageScore: number;
    topPlayer: {
      username: string;
      avatarUrl: string;
      score: number;
    } | null;
  }>;
  topRankedPlayers: Array<{
    rank: number;
    userId: string;
    username: string;
    avatarUrl: string;
    totalWins: number;
    totalPlays: number;
    bestScore: number;
    totalPoints: number;
    fastestTime: number;
    favoriteGame: string;
  }>;
  catalog: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
  }>;
}

export async function fetchMiniGameDashboard(): Promise<MiniGameDashboardData> {
  const res = await fetch(`${API_BASE}/minigames/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch mini game dashboard');
  return await res.json();
}

export async function fetchMiniGameLeaderboard(gameId?: string, difficulty?: string): Promise<{
  gameId: string;
  difficulty: string;
  leaderboard: Array<{
    rank: number;
    userId: string;
    username: string;
    avatarUrl: string;
    gameId: string;
    gameTitle: string;
    score: number;
    timeSeconds: number;
    accuracy?: number;
    difficulty: string;
    gameMode?: string;
    date: string;
  }>;
  topRuns: Array<{
    rank: number;
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    gameId: string;
    gameTitle: string;
    score: number;
    timeSeconds: number;
    accuracy?: number;
    difficulty: string;
    gameMode?: string;
    date: string;
  }>;
  totalEntries: number;
  recentScores: any[];
}> {
  const params = new URLSearchParams();
  if (gameId && gameId !== 'all') params.append('gameId', gameId);
  if (difficulty && difficulty !== 'all') params.append('difficulty', difficulty);

  const res = await fetch(`${API_BASE}/minigames/leaderboard?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch mini game leaderboard');
  return await res.json();
}

export async function fetchUserMiniGameStats(userId?: string, username?: string): Promise<any> {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (username) params.append('username', username);
  const res = await apiFetch(`${API_BASE}/minigames/user-stats?${params.toString()}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.stats || json;
}

export async function startMiniGameSession(data: {
  gameId: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
}): Promise<any> {
  const res = await apiFetch(`${API_BASE}/minigames/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Please log in to play games.');
  }
  return await res.json();
}

export async function submitMiniGameScore(data: {
  gameId: string;
  gameTitle?: string;
  score: number;
  timeSeconds: number;
  accuracy?: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  gameMode?: string;
  success: boolean;
  username?: string;
  avatarUrl?: string;
  userId?: string;
}): Promise<any> {
  const res = await apiFetch(`${API_BASE}/minigames/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Please log in to play games.');
  }
  return await res.json();
}

export async function dispatchSimulatorEvent(event: {
  type: 'chat' | 'subscription' | 'gift';
  username: string;
  content?: string;
  giftCount?: number;
}): Promise<any> {
  const mappedType = event.type === 'chat' ? 'CHAT' : event.type === 'subscription' ? 'SUB' : 'GIFT';
  const res = await apiFetch(`${API_BASE}/admin/test-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: mappedType,
      username: event.username,
      messageContent: event.content,
      giftCount: event.giftCount
    })
  });
  return await res.json();
}

export async function syncKickChannelStats(): Promise<any> {
  const res = await apiFetch(`${API_BASE}/admin/trigger-sync`, { method: 'POST' });
  return await res.json();
}

export async function updateChannelStats(data: Partial<ChannelStats>): Promise<any> {
  const res = await apiFetch(`${API_BASE}/admin/update-channel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update channel stats');
  return await res.json();
}

export async function fetchChatAnalytics(): Promise<{
  totalMessages: number;
  activeChatters: number;
  averageMessagesPerUser: number;
  topChatters: { kickUserId: string; username: string; avatarUrl: string; messageCount: number }[];
  recentMessages: ChatMessage[];
}> {
  const res = await fetch(`${API_BASE}/chat/analytics`);
  if (!res.ok) throw new Error('Failed to fetch chat analytics');
  return await res.json();
}

// --- Community Q/A for Chatters & Slyyutus ---

export interface QuestionItem {
  id: string;
  userId: string;
  kickUserId: string;
  username: string;
  avatarUrl: string;
  question: string;
  status: 'pending' | 'answered' | 'rejected';
  answer?: string;
  createdAt: string;
  answeredAt?: string;
  answeredBy?: string;
}

export async function submitQuestion(question: string): Promise<{ status: string; success: boolean; message: string; question: QuestionItem }> {
  const res = await apiFetch(`${API_BASE}/qa/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit question.');
  }
  return await res.json();
}

export async function fetchMyQuestions(): Promise<{ status: string; questions: QuestionItem[] }> {
  const res = await apiFetch(`${API_BASE}/qa/my-questions`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load your questions.');
  }
  return await res.json();
}

export async function fetchPublicQuestions(status?: string, sort: 'newest' | 'oldest' = 'newest'): Promise<{
  status: string;
  questions: QuestionItem[];
  total: number;
  pendingCount: number;
  answeredCount: number;
  rejectedCount?: number;
}> {
  const query = new URLSearchParams();
  if (status && status !== 'all') query.set('status', status);
  if (sort) query.set('sort', sort);

  const res = await apiFetch(`${API_BASE}/qa/questions?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load questions.');
  }
  return await res.json();
}

export async function fetchAdminQuestions(status?: string, sort: 'newest' | 'oldest' = 'newest'): Promise<{
  status: string;
  questions: QuestionItem[];
  total: number;
  pendingCount: number;
  answeredCount: number;
  rejectedCount: number;
}> {
  const query = new URLSearchParams();
  if (status && status !== 'all') query.set('status', status);
  if (sort) query.set('sort', sort);

  const res = await apiFetch(`${API_BASE}/qa/admin/questions?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load questions.');
  }
  return await res.json();
}

export async function answerAdminQuestion(id: string, answer: string): Promise<{ status: string; success: boolean; question: QuestionItem }> {
  const res = await apiFetch(`${API_BASE}/qa/admin/questions/${id}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit answer.');
  }
  return await res.json();
}

export async function updateAdminQuestionStatus(id: string, status: 'pending' | 'answered' | 'rejected'): Promise<{ status: string; success: boolean; question: QuestionItem }> {
  const res = await apiFetch(`${API_BASE}/qa/admin/questions/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update question status.');
  }
  return await res.json();
}

export async function deleteAdminQuestion(id: string): Promise<{ status: string; success: boolean }> {
  const res = await apiFetch(`${API_BASE}/qa/admin/questions/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete question.');
  }
  return await res.json();
}
