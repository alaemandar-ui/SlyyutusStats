export interface ChannelStats {
  id: string;
  slug: string;
  username: string;
  userId: number;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  followersCount: number;
  subscribersCount: number;
  totalViews: number;
  isLive: boolean;
  currentViewers: number;
  averageViewers: number;
  peakViewers: number;
  totalStreams: number;
  currentStreamTitle?: string;
  currentStreamCategory?: string;
  lastUpdated: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    youtube?: string;
    instagram?: string;
  };
}

export interface KickUser {
  kickUserId: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  firstSeenAt: string;
  lastActiveAt: string;
  totalChatMessages: number;
  totalSubscriptions: number;
  totalGifts: number;
  createdAt: string;
  isVerified?: boolean;
  role?: 'admin' | 'moderator' | 'vip' | 'user';
}

export interface LeagueSeason {
  seasonId: string; // e.g. "09-26"
  name: string; // "September 2026"
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFinalized: boolean;
  totalParticipants: number;
  totalPointsDistributed: number;
  finalizedAt?: string;
  topWinners?: {
    first?: { username: string; kickUserId: string; avatarUrl: string; points: number };
    second?: { username: string; kickUserId: string; avatarUrl: string; points: number };
    third?: { username: string; kickUserId: string; avatarUrl: string; points: number };
  };
}

export interface LeagueRankingEntry {
  rank: number;
  kickUserId: string;
  username: string;
  avatarUrl: string;
  points: number;
  messagesCount: number;
  subsCount: number;
  giftsCount: number;
  lastActiveAt: string;
  badges?: BadgeAward[];
  rankDelta?: number; // e.g. +2, -1, 0
}

export interface Badge {
  badgeId: string;
  title: string;
  description: string;
  iconType: string;
  badgeTier: 'gold' | 'silver' | 'bronze' | 'diamond' | 'flame' | 'special';
  permanent: boolean;
}

export interface BadgeAward {
  awardId: string;
  kickUserId: string;
  badgeId: string;
  badge: Badge;
  awardedAt: string;
  seasonId?: string;
  streamId?: string;
  seasonName?: string;
  streamTitle?: string;
}

export interface StreamVod {
  streamId: string;
  title: string;
  category: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  views: number;
  averageViewers: number;
  peakViewers: number;
  subsGained: number;
  subscribersGained?: number;
  totalChatMessages: number;
  vodUrl?: string;
  thumbnailUrl?: string;
  isLive: boolean;
  subscribers?: {
    kickUserId: string;
    username: string;
    avatarUrl: string;
    type: string;
    timestamp: string;
  }[];
  topChatters?: {
    rank: number;
    kickUserId: string;
    username: string;
    avatarUrl: string;
    messageCount: number;
  }[];
}

export interface VodChatterRanking {
  rank: number;
  kickUserId: string;
  username: string;
  avatarUrl: string;
  messageCount: number;
  badgeAwarded?: string;
}

export type VodChatterRank = VodChatterRanking;

export interface ChatMessage {
  messageId: string;
  kickUserId: string;
  username: string;
  avatarUrl: string;
  streamId: string;
  streamTitle?: string;
  content: string;
  pointsAwarded: number;
  timestamp?: string;
  sentAt?: string;
  badges?: string[];
}

export interface PointRule {
  ruleKey: string;
  pointValue: number;
  description: string;
  updatedAt: string;
}

export interface UserProfileData {
  user: KickUser;
  currentSeasonRank: number | null;
  currentSeasonPoints: number;
  currentSeasonMessages: number;
  currentSeasonSubs: number;
  currentSeasonGifts: number;
  seasonHistory: {
    seasonId: string;
    seasonName: string;
    rank: number;
    points: number;
    messagesCount: number;
    subsCount: number;
    giftsCount: number;
  }[];
  badges: BadgeAward[];
  vodParticipation: {
    streamId: string;
    streamTitle: string;
    startedAt: string;
    messagesCount: number;
    rank: number;
    badgeAwarded?: string;
  }[];
  recentMessages?: ChatMessage[];
}

export interface MyStatsResponse {
  user: KickUser;
  seasonId: string;
  seasonName: string;
  rank: number | null;
  points: number;
  messagesCount: number;
  subsCount: number;
  giftsCount: number;
  pointsToNextRank: number | null;
  nextRank: number | null;
  badges: BadgeAward[];
}

export interface KickUserSearchResult {
  kickUserId: string;
  username: string;
  avatarUrl: string;
  totalChatMessages: number;
  currentRank: number | null;
  currentPoints: number;
  badges: BadgeAward[];
}

export interface AdminOverviewData {
  channel: ChannelStats;
  activeSeason: LeagueSeason;
  pointRules: Record<string, number>;
  totalUsers: number;
  recentUsers: any[];
  badgesCatalog: Badge[];
  systemLogs: SystemLog[];
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    kickUserId: string;
    username: string;
    avatarUrl: string;
    email?: string;
    role: 'admin' | 'user';
  } | null;
  isAdmin: boolean;
}

export interface PointTransaction {
  id: string;
  kickUserId: string;
  username: string;
  seasonId: string;
  type: string;
  pointsAwarded: number;
  totalPointsAfter: number;
  eventId?: string;
  streamId?: string;
  description: string;
  timestamp: string;
}
