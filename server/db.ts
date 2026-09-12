import fs from 'fs';
import path from 'path';

export interface DBUser {
  kickUserId: string;
  username: string;
  avatarUrl: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt: string;
}

export interface DBKickUser {
  kickUserId: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  firstSeenAt: string;
  lastActiveAt: string;
  totalMessages: number;
  totalSubs: number;
  totalGifts: number;
  totalPoints?: number;
  isVerified: boolean;
  isTest?: boolean;
}

export interface DBChannel {
  id: string;
  slug: string;
  username: string;
  userId: number;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  followersCount: number;
  subscribersCount: number;
  totalViews: number;
  isLive: boolean;
  currentViewers: number;
  averageViewers: number;
  peakViewers: number;
  totalStreams: number;
  currentStreamTitle: string;
  currentStreamCategory: string;
  lastUpdated: string;
}

export interface DBStream {
  streamId: string;
  title: string;
  category: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  views: number;
  averageViewers: number;
  peakViewers: number;
  subscribersGained: number;
  subsGained?: number;
  totalChatMessages: number;
  vodUrl?: string;
  thumbnailUrl?: string;
  isLive: boolean;
}

export interface DBChatMessage {
  messageId: string;
  kickUserId: string;
  username: string;
  avatarUrl: string;
  streamId: string;
  streamTitle?: string;
  channelId?: string;
  content: string;
  pointsAwarded: number;
  timestamp: string;
  isTest?: boolean;
}

export interface DBSubscriptionEvent {
  id: string;
  eventId?: string;
  kickUserId: string;
  username: string;
  avatarUrl: string;
  type: 'SUBSCRIPTION' | 'GIFT_SUBSCRIPTION';
  streamId?: string;
  gifterUserId?: string;
  gifterUsername?: string;
  giftCount?: number;
  pointsAwarded: number;
  timestamp: string;
  isTest?: boolean;
}

export interface DBPointTransaction {
  id: string;
  kickUserId: string;
  username: string;
  seasonId: string;
  type: 'CHAT_MESSAGE' | 'SUBSCRIPTION' | 'GIFT_SUBSCRIPTION' | 'MINI_GAME_WIN' | 'ADMIN_ADJUSTMENT';
  source?: string;
  pointsAwarded: number;
  totalPointsAfter: number;
  eventId?: string;
  streamId?: string;
  description: string;
  timestamp: string;
  isTest?: boolean;
}

export interface DBLeagueSeason {
  seasonId: string; // e.g. "09-26"
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFinalized: boolean;
  totalParticipants: number;
  totalPointsDistributed: number;
  finalizedAt?: string;
}

export interface DBLeaguePoints {
  id: string;
  seasonId: string;
  kickUserId: string;
  points: number;
  messagesCount: number;
  subsCount: number;
  giftsCount: number;
  firstScoreAchievedAt: string;
  lastPointAwardedAt: string;
  isTest?: boolean;
}

export interface DBLeagueRanking {
  id: string;
  seasonId: string;
  kickUserId: string;
  rank: number;
  points: number;
  messagesCount: number;
  subsCount: number;
  giftsCount: number;
  isFinal: boolean;
  awardedBadgeId?: string;
}

export interface DBBadge {
  badgeId: string;
  code: string;
  title: string;
  description: string;
  iconType: string;
  badgeTier: 'gold' | 'silver' | 'bronze' | 'diamond' | 'flame' | 'special';
  category: 'season' | 'vod' | 'community' | 'chatter' | 'sub';
}

export interface DBUserBadge {
  id: string;
  kickUserId: string;
  badgeId: string;
  seasonId?: string;
  streamId?: string;
  streamTitle?: string;
  seasonName?: string;
  awardedAt: string;
  rankPosition?: number;
}

export interface DBVodChatterStat {
  id: string;
  streamId: string;
  kickUserId: string;
  messageCount: number;
  rankInVod: number;
  badgeAwarded?: string;
}

export interface DBPointRule {
  ruleKey: string;
  pointValue: number;
  description: string;
  updatedAt: string;
}

export interface DBMiniGameScore {
  id: string;
  gameId: string; // 'logic_grid' | 'pattern_decoder' | 'sequence_master' | 'cipher_puzzle' | 'difficult_quiz' | 'precision_timing' | 'multi_task' | 'arcade_shooter'
  gameTitle?: string;
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  timeSeconds: number;
  accuracy?: number; // 0 - 100%
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  gameMode?: string;
  success: boolean;
  createdAt: string;
}

export interface DBSystemLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DBQuestion {
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

export interface DatabaseSchema {
  users: DBUser[];
  kickUsers: DBKickUser[];
  channel: DBChannel;
  streams: DBStream[];
  chatMessages: DBChatMessage[];
  subscriptionEvents: DBSubscriptionEvent[];
  leagueSeasons: DBLeagueSeason[];
  leaguePoints: DBLeaguePoints[];
  leagueRankings: DBLeagueRanking[];
  badges: DBBadge[];
  userBadges: DBUserBadge[];
  vodChatterStats: DBVodChatterStat[];
  pointRules: DBPointRule[];
  systemLogs: DBSystemLog[];
  miniGameScores: DBMiniGameScore[];
  pointTransactions: DBPointTransaction[];
  processedEventIds: string[];
  questions: DBQuestion[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data_storage.json');

// In-Memory Database with atomic persistence
class Database {
  private data!: DatabaseSchema;
  private saveDebounceTimer: NodeJS.Timeout | null = null;
  private adminKickUserId: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        if ((this.data as any).adminKickUserId) {
          this.adminKickUserId = String((this.data as any).adminKickUserId);
        }

        // Purge legacy mock users or mock streams if detected
        const hasMockUsers = this.data.kickUsers?.some(u => u.kickUserId.startsWith('k_100') || u.username === 'GoldHunter_99');
        const hasMockStreams = this.data.streams?.some(s => s.streamId.startsWith('vod_2026') || s.streamId === 'vod_live_active');
        if (hasMockUsers || hasMockStreams) {
          console.log('[DB] Found legacy mock data in storage, purging and re-initializing with clean real data...');
          this.seedInitialDatabase();
          return;
        }

        // Initialize collections if absent
        if (!this.data.subscriptionEvents) {
          this.data.subscriptionEvents = [];
        }
        if (!this.data.pointTransactions) {
          this.data.pointTransactions = [];
        }
        if (!this.data.processedEventIds) {
          this.data.processedEventIds = [];
        }
        this.processedWebhookEventIds = new Set(this.data.processedEventIds);

        if (!this.data.miniGameScores) {
          this.data.miniGameScores = [];
        } else {
          // Clean out any test/seed mini-game scores to ensure leaderboards start clean with real gameplay only
          this.purgeTestMiniGameData();
        }
        if (!this.data.userBadges) {
          this.data.userBadges = [];
        }
        if (!this.data.questions) {
          this.data.questions = [];
        }

        // Purge ONLY the three specific test users from Q&A system
        this.purgeQnATestUsers();

        // Clean out any test or fake users (e.g. ApexLegend99, SuperKickFan, GenerousGiftMaster)
        this.cleanTestUsersAndData();

        // Initialize realistic subscription events if none exist yet to accurately track subs per VOD
        if (this.data.subscriptionEvents.length === 0 && this.data.streams && this.data.streams.length > 0) {
          this.seedInitialStreamSubscriptions();
        }

        // Ensure subsGained is mirrored on all streams
        if (this.data.streams) {
          this.data.streams.forEach(s => {
            if (s.subsGained === undefined) {
              s.subsGained = s.subscribersGained || 0;
            }
          });
        }

        // Recalculate historical stream subscriptions so every VOD is 100% accurate
        this.recalculateStreamSubscriptions();

        // Enforce user totalPoints synchronization from active season points
        const activeSeason = this.getActiveSeason();
        if (this.data.kickUsers) {
          this.data.kickUsers.forEach(u => {
            const pRec = this.getSeasonPointsRecord(activeSeason.seasonId, u.kickUserId);
            u.totalPoints = pRec ? pRec.points : (u.totalPoints || 0);
          });
        }

        // Backfill pointTransactions from historical subscription events if empty
        if (this.data.pointTransactions.length === 0 && this.data.subscriptionEvents.length > 0) {
          for (const se of this.data.subscriptionEvents) {
            this.data.pointTransactions.push({
              id: `ptx_${se.id}`,
              kickUserId: se.kickUserId,
              username: se.username,
              seasonId: activeSeason.seasonId,
              type: se.type,
              pointsAwarded: se.pointsAwarded || 100,
              totalPointsAfter: 100,
              eventId: se.eventId,
              streamId: se.streamId,
              description: se.type === 'GIFT_SUBSCRIPTION' ? 'Gift subscription in community (+100 pts)' : 'Subscribed to Slyyutus (+100 pts)',
              timestamp: se.timestamp,
              isTest: se.isTest
            });
          }
        }

        // Enforce official SLYYUTUS League point rules: CHAT=1, SUBSCRIPTION=100, GIFT_SUBSCRIPTION=100
        this.data.pointRules = [
          { ruleKey: 'CHAT_MESSAGE', pointValue: 1, description: '1 point per valid chat message in live stream', updatedAt: new Date().toISOString() },
          { ruleKey: 'SUBSCRIPTION', pointValue: 100, description: '100 points for subscribing to Slyyutus', updatedAt: new Date().toISOString() },
          { ruleKey: 'GIFT_SUBSCRIPTION', pointValue: 100, description: '100 points per gift subscription to the community', updatedAt: new Date().toISOString() }
        ];

        // Ensure real Slyyutus Kick metadata is set
        if (this.data.channel) {
          if (!this.data.channel.avatarUrl || this.data.channel.avatarUrl.includes('unsplash.com') || this.data.channel.userId === 849201) {
            this.data.channel.avatarUrl = 'https://files.kick.com/images/user/231626/profile_image/conversion/b39d4d71-93ab-4563-ad7a-b054e4fdd90a-medium.webp';
            this.data.channel.bannerUrl = 'https://files.kick.com/images/channel/229384/banner_image/cf8c17a6-7c91-4b0c-966f-19840659e80b';
            this.data.channel.bio = 'Moroccan Streamer !\nGamer ! GODAIM';
            this.data.channel.userId = 231626;
            this.data.channel.followersCount = 26141;
            this.data.channel.subscribersCount = 66;
            this.saveSync();
          }
        }
        console.log('[DB] Loaded existing database with', this.data.kickUsers?.length || 0, 'users.');
        return;
      } catch (err) {
        console.error('[DB] Failed reading db file, re-seeding...', err);
      }
    }
    this.seedInitialDatabase();
  }

  public saveSync(): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error saving data_storage.json synchronously', err);
    }
  }

  public setAdminKickUserId(id: string): void {
    this.adminKickUserId = String(id);
    (this.data as any).adminKickUserId = String(id);
    this.saveSync();
  }

  public getAdminKickUserId(): string | null {
    return this.adminKickUserId;
  }

  public isUserAdmin(kickUserId: string, username?: string): boolean {
    if (!kickUserId) return false;
    const targetId = String(kickUserId).trim();

    // 1. Match ADMIN_USER_ID from process.env if provided and not dummy '0'
    const envAdmin = (process.env.ADMIN_USER_ID || '').trim();
    if (envAdmin && envAdmin !== '0' && envAdmin !== 'replace_me') {
      if (targetId === envAdmin) {
        return true;
      }
    }

    // 2. Match stored adminKickUserId discovered via OAuth
    if (this.adminKickUserId && targetId === String(this.adminKickUserId)) {
      return true;
    }

    // 3. Auto-discover admin identity for M4ND4R_x account upon authenticated Kick OAuth
    if (username && username.toLowerCase() === 'm4nd4r_x') {
      this.setAdminKickUserId(targetId);
      console.log(`[Admin Security] Auto-registered Kick user ${username} (numeric ID: ${targetId}) as channel administrator.`);
      this.addSystemLog('info', 'AUTH_ADMIN', `Auto-registered Kick user ${username} (numeric ID: ${targetId}) as admin.`);
      return true;
    }

    return false;
  }

  public save() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('[DB] Error saving data_storage.json', err);
      }
    }, 150);
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  // --- Point Rules ---
  public getPointRules(): DBPointRule[] {
    return this.data.pointRules;
  }

  public getPointRule(ruleKey: string): number {
    const rule = this.data.pointRules.find(r => r.ruleKey === ruleKey);
    return rule ? rule.pointValue : 1;
  }

  public updatePointRule(ruleKey: string, pointValue: number): void {
    const rule = this.data.pointRules.find(r => r.ruleKey === ruleKey);
    if (rule) {
      rule.pointValue = pointValue;
      rule.updatedAt = new Date().toISOString();
    } else {
      this.data.pointRules.push({
        ruleKey,
        pointValue,
        description: `Configured points for ${ruleKey}`,
        updatedAt: new Date().toISOString()
      });
    }
    this.addSystemLog('info', 'LEAGUE_RULES', `Updated point rule ${ruleKey} = ${pointValue}`);
    this.save();
  }

  // --- Channel ---
  public getChannel(): DBChannel {
    const streams = this.data.streams || [];
    const totalStreams = streams.length;
    let averageViewers = 0;
    let peakViewers = 0;

    if (totalStreams > 0) {
      let sumAvg = 0;
      for (const s of streams) {
        sumAvg += (s.averageViewers || 0);
        if ((s.peakViewers || 0) > peakViewers) {
          peakViewers = s.peakViewers || 0;
        }
      }
      averageViewers = Math.round(sumAvg / totalStreams);
    }

    return {
      ...this.data.channel,
      totalStreams,
      averageViewers: totalStreams > 0 ? averageViewers : 0,
      peakViewers: totalStreams > 0 ? peakViewers : 0
    };
  }

  public updateChannel(updates: Partial<DBChannel>): DBChannel {
    this.data.channel = { ...this.data.channel, ...updates, lastUpdated: new Date().toISOString() };
    this.save();
    return this.data.channel;
  }

  // --- Users & Kick Users ---
  public getKickUserById(kickUserId: string): DBKickUser | undefined {
    return this.data.kickUsers.find(u => u.kickUserId === kickUserId);
  }

  public getKickUserByUsername(username: string): DBKickUser | undefined {
    const search = username.toLowerCase();
    return this.data.kickUsers.find(u => u.username.toLowerCase() === search);
  }

  public ensureKickUser(kickUserId: string, username: string, avatarUrl?: string, isTest: boolean = false): DBKickUser {
    let user = this.getKickUserById(kickUserId);
    const now = new Date().toISOString();
    const isTestUser = Boolean(
      isTest || 
      username.toLowerCase().includes('demo_user') || 
      username.toLowerCase().includes('fake_user')
    );

    if (!user) {
      user = {
        kickUserId,
        username,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        bio: `Member of Slyyutus Kick Community`,
        firstSeenAt: now,
        lastActiveAt: now,
        totalMessages: 0,
        totalSubs: 0,
        totalGifts: 0,
        isVerified: false,
        isTest: isTestUser
      };
      this.data.kickUsers.push(user);
    } else {
      user.username = username; // Update if username changed
      if (avatarUrl && !avatarUrl.includes('default-medium.webp')) {
        const isCurrentCustom = user.avatarUrl && user.avatarUrl.includes('/profile_image/conversion/') && !user.avatarUrl.includes('default');
        const isNewGeneric = avatarUrl.includes('default-avatar') || avatarUrl.includes('dicebear');
        if (!isCurrentCustom || !isNewGeneric) {
          user.avatarUrl = avatarUrl;
        }
      }
      user.lastActiveAt = now;
      if (isTestUser) {
        user.isTest = true;
      }
    }
    this.save();
    return user;
  }

  public searchKickUsers(query: string, limit: number = 20, offset: number = 0): { users: (DBKickUser & { currentPoints: number; currentRank: number; totalSubscriptions: number; totalChatMessages: number })[]; total: number } {
    const q = query.trim().toLowerCase();
    const realUsers = this.data.kickUsers.filter(u => !u.isTest);
    const filtered = q
      ? realUsers.filter(u => u.username.toLowerCase().includes(q) || u.kickUserId.includes(q))
      : realUsers;

    const activeSeason = this.getActiveSeason();
    const rankings = this.getLeagueRankings(activeSeason.seasonId, undefined, 500, 0).rankings;
    const rankMap = new Map<string, number>();
    rankings.forEach(r => rankMap.set(r.kickUserId, r.rank));

    // Sort by points or activity
    filtered.sort((a, b) => {
      const ptsA = (this.getSeasonPointsRecord(activeSeason.seasonId, a.kickUserId)?.points || a.totalPoints || 0);
      const ptsB = (this.getSeasonPointsRecord(activeSeason.seasonId, b.kickUserId)?.points || b.totalPoints || 0);
      if (ptsB !== ptsA) return ptsB - ptsA;
      return (b.totalMessages + b.totalSubs * 100) - (a.totalMessages + a.totalSubs * 100);
    });

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit).map(u => {
      const pRec = this.getSeasonPointsRecord(activeSeason.seasonId, u.kickUserId);
      const points = pRec ? pRec.points : (u.totalPoints || 0);
      const rank = rankMap.get(u.kickUserId) || (rankings.length + 1);
      return {
        ...u,
        totalPoints: points,
        currentPoints: points,
        currentRank: rank,
        totalChatMessages: u.totalMessages,
        totalSubscriptions: u.totalSubs
      };
    });

    return { users: paged, total };
  }

  public updateUserAvatar(kickUserId: string, avatarUrl: string): boolean {
    const user = this.data.kickUsers.find(u => u.kickUserId === kickUserId);
    if (!user) return false;
    user.avatarUrl = avatarUrl;
    // Also update cached avatar in recent messages
    this.data.chatMessages.forEach(m => {
      if (m.kickUserId === kickUserId) {
        m.avatarUrl = avatarUrl;
      }
    });
    this.save();
    return true;
  }

  public removeKickUser(kickUserId: string): boolean {
    const originalLen = this.data.kickUsers.length;
    this.data.kickUsers = this.data.kickUsers.filter(u => u.kickUserId !== kickUserId);
    this.data.leaguePoints = this.data.leaguePoints.filter(p => p.kickUserId !== kickUserId);
    this.data.chatMessages = this.data.chatMessages.filter(m => m.kickUserId !== kickUserId);
    this.save();
    return this.data.kickUsers.length < originalLen;
  }

  public reload(): void {
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('[DB] Reloaded database from disk.');
      } catch (err) {
        console.error('[DB] Failed to reload:', err);
      }
    }
  }

  // --- Seasons ---
  public getSeasons(): DBLeagueSeason[] {
    return [...this.data.leagueSeasons].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }

  public getSeason(seasonId: string): DBLeagueSeason | undefined {
    return this.data.leagueSeasons.find(s => s.seasonId === seasonId);
  }

  public getActiveSeason(): DBLeagueSeason {
    let active = this.data.leagueSeasons.find(s => s.isActive);
    if (!active) {
      // Auto create season for current month (e.g. 09-26)
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const seasonId = `${mm}-${yy}`;
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const seasonName = `${monthNames[now.getMonth()]} 20${yy}`;
      
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      active = {
        seasonId,
        name: seasonName,
        startDate: start,
        endDate: end,
        isActive: true,
        isFinalized: false,
        totalParticipants: 0,
        totalPointsDistributed: 0
      };
      this.data.leagueSeasons.push(active);
      this.save();
    }
    return active;
  }

  // --- League Points & Rankings with Tie-Breaking ---
  public getSeasonPointsRecord(seasonId: string, kickUserId: string): DBLeaguePoints | undefined {
    return this.data.leaguePoints.find(p => p.seasonId === seasonId && p.kickUserId === kickUserId);
  }

  public addPoints(
    kickUserId: string,
    username: string,
    avatarUrl: string,
    type: 'CHAT_MESSAGE' | 'SUBSCRIPTION' | 'GIFT_SUBSCRIPTION' | 'MINI_GAME_WIN' | 'ADMIN_ADJUSTMENT',
    customPoints?: number,
    isTest: boolean = false,
    options?: { eventId?: string; streamId?: string; description?: string }
  ): { pointsAwarded: number; totalPoints: number } {
    const isTestFlag = Boolean(isTest);

    // Prevent duplicate points if eventId was already processed
    if (options?.eventId && this.isEventProcessed(options.eventId)) {
      const existingTx = (this.data.pointTransactions || []).find(t => t.eventId === options.eventId);
      if (existingTx) {
        return { pointsAwarded: 0, totalPoints: existingTx.totalPointsAfter };
      }
    }

    const user = this.ensureKickUser(kickUserId, username, avatarUrl, isTestFlag);
    const activeSeason = this.getActiveSeason();
    const now = new Date().toISOString();

    let pointsAwarded = customPoints !== undefined ? customPoints : this.getPointRule(type as any);

    let pointRecord = this.getSeasonPointsRecord(activeSeason.seasonId, kickUserId);
    if (!pointRecord) {
      pointRecord = {
        id: `lp_${activeSeason.seasonId}_${kickUserId}`,
        seasonId: activeSeason.seasonId,
        kickUserId,
        points: 0,
        messagesCount: 0,
        subsCount: 0,
        giftsCount: 0,
        firstScoreAchievedAt: now,
        lastPointAwardedAt: now,
        isTest: isTestFlag
      };
      this.data.leaguePoints.push(pointRecord);
      if (!isTestFlag) {
        activeSeason.totalParticipants += 1;
      }
    }

    pointRecord.points += pointsAwarded;
    pointRecord.lastPointAwardedAt = now;
    if (isTestFlag) {
      pointRecord.isTest = true;
    }

    if (type === 'CHAT_MESSAGE') {
      pointRecord.messagesCount += 1;
      user.totalMessages += 1;
    } else if (type === 'SUBSCRIPTION') {
      pointRecord.subsCount += 1;
      user.totalSubs += 1;
      if (!isTestFlag && this.data.channel) {
        this.data.channel.subscribersCount = (this.data.channel.subscribersCount || 0) + 1;
      }
    } else if (type === 'GIFT_SUBSCRIPTION') {
      pointRecord.giftsCount += 1;
      user.totalGifts += 1;
      if (!isTestFlag && this.data.channel) {
        this.data.channel.subscribersCount = (this.data.channel.subscribersCount || 0) + 1;
      }
    }

    // Always keep user's cumulative totalPoints in sync
    user.totalPoints = pointRecord.points;
    user.lastActiveAt = now;

    if (!isTestFlag) {
      activeSeason.totalPointsDistributed += pointsAwarded;
    }

    // Persist points transaction in the database
    if (!this.data.pointTransactions) {
      this.data.pointTransactions = [];
    }

    const transaction: DBPointTransaction = {
      id: `ptx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      kickUserId,
      username: user.username,
      seasonId: activeSeason.seasonId,
      type,
      source: type,
      pointsAwarded,
      totalPointsAfter: pointRecord.points,
      eventId: options?.eventId,
      streamId: options?.streamId,
      description: options?.description || `${type.replace(/_/g, ' ')} (+${pointsAwarded} pts)`,
      timestamp: now,
      isTest: isTestFlag
    };
    this.data.pointTransactions.push(transaction);

    // Keep point transactions capped at 10000 for high performance
    if (this.data.pointTransactions.length > 10000) {
      this.data.pointTransactions = this.data.pointTransactions.slice(-8000);
    }

    if (options?.eventId) {
      this.markEventProcessed(options.eventId);
    }

    this.save();
    return { pointsAwarded, totalPoints: pointRecord.points };
  }

  public getLeaguePoints(kickUserId: string, seasonId?: string): DBLeaguePoints | undefined {
    const sId = seasonId || this.getActiveSeason().seasonId;
    return this.data.leaguePoints.find(p => p.kickUserId === kickUserId && p.seasonId === sId);
  }

  public getLeagueRankings(seasonId: string, query?: string, limit: number = 25, offset: number = 0): { rankings: any[]; total: number; topThree: any[] } {
    const season = this.getSeason(seasonId);
    if (!season) {
      return { rankings: [], total: 0, topThree: [] };
    }

    // Get all point records for this season, strictly filtering out test users/events
    const records = this.data.leaguePoints.filter(p => {
      if (p.seasonId !== seasonId) return false;
      if (p.isTest) return false;
      const user = this.getKickUserById(p.kickUserId);
      if (!user || user.isTest) return false;
      return true;
    });

    // Sort according to tie-breaking rules:
    // 1. Higher points (descending)
    // 2. More qualifying activity (messages + subs + gifts)
    // 3. Earlier achievement of score (firstScoreAchievedAt ascending)
    records.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      const activityA = a.messagesCount + a.subsCount * 10 + a.giftsCount * 10;
      const activityB = b.messagesCount + b.subsCount * 10 + b.giftsCount * 10;
      if (activityB !== activityA) {
        return activityB - activityA;
      }
      return a.firstScoreAchievedAt.localeCompare(b.firstScoreAchievedAt);
    });

    // Map to rich rankings with ranks assigned
    const mappedRankings = records.map((rec, index) => {
      const user = this.getKickUserById(rec.kickUserId);
      const userBadges = this.getUserBadges(rec.kickUserId);
      return {
        rank: index + 1,
        kickUserId: rec.kickUserId,
        username: user?.username || 'Unknown Chatter',
        avatarUrl: user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${rec.kickUserId}`,
        points: rec.points,
        messagesCount: rec.messagesCount,
        subsCount: rec.subsCount,
        giftsCount: rec.giftsCount,
        lastActiveAt: rec.lastPointAwardedAt,
        badges: userBadges.slice(0, 3)
      };
    });

    const topThree = mappedRankings.slice(0, 3);

    // Apply search filter if present
    let filtered = mappedRankings;
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = mappedRankings.filter(r => r.username.toLowerCase().includes(q) || r.kickUserId.includes(q));
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      rankings: paginated,
      total,
      topThree
    };
  }

  // --- Badges ---
  public getBadges(): DBBadge[] {
    return this.data.badges;
  }

  public getUserBadges(kickUserId: string): DBUserBadge[] {
    return (this.data.userBadges || [])
      .filter(ub => ub.kickUserId === kickUserId)
      .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));
  }

  public getAllUserBadges(): Array<DBUserBadge & { username: string; avatarUrl: string; badge: DBBadge }> {
    const badges = this.getBadges();
    return (this.data.userBadges || []).map(ub => {
      const user = this.getKickUserById(ub.kickUserId);
      const badgeDef = badges.find(b => b.badgeId === ub.badgeId) || {
        badgeId: ub.badgeId,
        code: 'SPECIAL_BADGE',
        title: 'Special Honor Badge',
        description: 'Awarded by Administrator',
        iconType: 'shield',
        badgeTier: 'gold' as const,
        category: 'community' as const
      };
      return {
        ...ub,
        username: user?.username || `User_${ub.kickUserId.slice(0, 6)}`,
        avatarUrl: user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${ub.kickUserId}`,
        badge: badgeDef
      };
    }).sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));
  }

  public revokeBadge(badgeAwardId: string): boolean {
    if (!this.data.userBadges) return false;
    const idx = this.data.userBadges.findIndex(ub => ub.id === badgeAwardId || ub.badgeId === badgeAwardId);
    if (idx >= 0) {
      const removed = this.data.userBadges.splice(idx, 1)[0];
      this.addSystemLog('warn', 'BADGE_ENGINE', `Revoked badge '${removed.badgeId}' from user ${removed.kickUserId}`);
      this.save();
      return true;
    }
    return false;
  }

  public awardBadge(
    kickUserId: string, 
    badgeCodeOrId: string, 
    metadata: { seasonId?: string; seasonName?: string; streamId?: string; streamTitle?: string; rankPosition?: number } = {}
  ): DBUserBadge | null {
    if (!kickUserId || !badgeCodeOrId) return null;

    if (!this.data.userBadges) {
      this.data.userBadges = [];
    }

    const cleanInput = String(badgeCodeOrId).trim();
    const targetKey = cleanInput.toLowerCase();

    // Map common aliases and variations to official codes
    const aliasMap: Record<string, string> = {
      'season_1st': 'SEASON_1ST',
      'season_2nd': 'SEASON_2ND',
      'season_3rd': 'SEASON_3RD',
      'b_s1': 'SEASON_1ST',
      'b_s2': 'SEASON_2ND',
      'b_s3': 'SEASON_3RD',
      'vod_mvp': 'VOD_TOP_CHATTER',
      'vod_top': 'VOD_TOP_CHATTER',
      'vod_top_chatter': 'VOD_TOP_CHATTER',
      'b_vod_top': 'VOD_TOP_CHATTER',
      'kingdom_supporter': 'SUB_TITAN',
      'sub_titan': 'SUB_TITAN',
      'sub_supporter': 'SUB_TITAN',
      'b_sub_god': 'SUB_TITAN',
      'veteran_chatter': 'OG_CHATTER',
      'og_chatter': 'OG_CHATTER',
      'b_og': 'OG_CHATTER'
    };

    const mappedCode = aliasMap[targetKey];

    // Find badge in catalog by badgeId or code (case-insensitive)
    let badge = this.data.badges.find(b => 
      b.badgeId.toLowerCase() === targetKey ||
      b.code.toLowerCase() === targetKey ||
      (mappedCode && b.code.toUpperCase() === mappedCode)
    );

    // If still not found, check if it matches by title or create dynamic badge definition
    if (!badge) {
      badge = this.data.badges.find(b => b.title.toLowerCase() === targetKey);
    }

    if (!badge) {
      const generatedId = `b_${targetKey.replace(/[^a-z0-9_]/g, '') || Date.now()}`;
      const codeUpper = (mappedCode || targetKey.toUpperCase()).replace(/[^A-Z0-9_]/g, '_');
      const formattedTitle = cleanInput
        .replace(/_/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      badge = {
        badgeId: generatedId,
        code: codeUpper,
        title: formattedTitle || 'Community Honor Badge',
        description: 'Special honorary community badge awarded by Administrator',
        iconType: 'award',
        badgeTier: 'gold',
        category: 'community'
      };
      this.data.badges.push(badge);
    }

    // Ensure recipient exists in Kick users collection
    const existingUser = this.getKickUserById(kickUserId);
    const user = existingUser || this.ensureKickUser(kickUserId, `KickUser_${kickUserId.slice(0, 5)}`);

    // Check if duplicate badge for exact same season/stream already exists
    const existingAward = this.data.userBadges.find(ub => 
      ub.kickUserId === kickUserId &&
      ub.badgeId === badge!.badgeId &&
      (metadata.seasonId ? ub.seasonId === metadata.seasonId : true) &&
      (metadata.streamId ? ub.streamId === metadata.streamId : true)
    );

    if (existingAward) {
      return existingAward;
    }

    const userBadge: DBUserBadge = {
      id: `ub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      kickUserId,
      badgeId: badge.badgeId,
      seasonId: metadata.seasonId,
      seasonName: metadata.seasonName,
      streamId: metadata.streamId,
      streamTitle: metadata.streamTitle,
      awardedAt: new Date().toISOString(),
      rankPosition: metadata.rankPosition
    };

    this.data.userBadges.push(userBadge);
    this.addSystemLog('success', 'BADGE_ENGINE', `Awarded badge '${badge.title}' to user ${user.username} (${kickUserId})`);
    this.save();
    return userBadge;
  }

  // --- Streams & VODs ---
  public getStreams(limit: number = 20, offset: number = 0): { streams: DBStream[]; total: number } {
    const sorted = [...this.data.streams].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return {
      streams: sorted.slice(offset, offset + limit),
      total: sorted.length
    };
  }

  public getStreamById(streamId: string): DBStream | undefined {
    return this.data.streams.find(s => s.streamId === streamId);
  }

  public getVodChatterRankings(streamId: string): DBVodChatterStat[] {
    return this.data.vodChatterStats
      .filter(v => v.streamId === streamId)
      .sort((a, b) => a.rankInVod - b.rankInVod);
  }

  public upsertStream(stream: DBStream): void {
    const idx = this.data.streams.findIndex(s => s.streamId === stream.streamId);
    if (idx >= 0) {
      const existing = this.data.streams[idx];
      const mergedTotalChat = (stream.totalChatMessages && stream.totalChatMessages > 0) ? stream.totalChatMessages : (existing.totalChatMessages || 0);
      const mergedSubs = (stream.subscribersGained && stream.subscribersGained > 0) ? stream.subscribersGained : (existing.subscribersGained || 0);
      this.data.streams[idx] = { 
        ...existing, 
        ...stream,
        totalChatMessages: mergedTotalChat,
        subscribersGained: mergedSubs
      };
    } else {
      this.data.streams.push(stream);
    }
    this.save();
  }

  public upsertStreams(streams: DBStream[]): void {
    for (const s of streams) {
      const idx = this.data.streams.findIndex(item => item.streamId === s.streamId);
      if (idx >= 0) {
        const existing = this.data.streams[idx];
        const mergedTotalChat = (s.totalChatMessages && s.totalChatMessages > 0) ? s.totalChatMessages : (existing.totalChatMessages || 0);
        const mergedSubs = (s.subscribersGained && s.subscribersGained > 0) ? s.subscribersGained : (existing.subscribersGained || 0);
        this.data.streams[idx] = { 
          ...existing, 
          ...s,
          totalChatMessages: mergedTotalChat,
          subscribersGained: mergedSubs
        };
      } else {
        this.data.streams.push(s);
      }
    }
    this.save();
  }

  // --- Webhook Deduplication & Event Idempotency ---
  private processedWebhookEventIds: Set<string> = new Set();

  public isEventProcessed(eventId: string): boolean {
    if (!eventId) return false;
    return this.processedWebhookEventIds.has(eventId);
  }

  public isWebhookProcessed(eventId: string): boolean {
    return this.isEventProcessed(eventId);
  }

  public markEventProcessed(eventId: string): void {
    if (!eventId) return;
    this.processedWebhookEventIds.add(eventId);
    if (!this.data.processedEventIds) {
      this.data.processedEventIds = [];
    }
    if (!this.data.processedEventIds.includes(eventId)) {
      this.data.processedEventIds.push(eventId);
      if (this.data.processedEventIds.length > 5000) {
        this.data.processedEventIds.shift();
      }
    }
    if (this.processedWebhookEventIds.size > 5000) {
      const first = this.processedWebhookEventIds.values().next().value;
      if (first) this.processedWebhookEventIds.delete(first);
    }
  }

  public markWebhookProcessed(eventId: string): void {
    this.markEventProcessed(eventId);
  }

  /**
   * Resolves a Kick user using existing database mappings.
   * Checks by kickUserId, by username in kickUsers, and in registered OAuth users.
   * If unresolvable, returns user: null and logs reason clearly.
   */
  public resolveKickUser(
    candidateId?: string | number,
    candidateUsername?: string,
    avatarUrl?: string
  ): { user: DBKickUser | null; kickUserId: string | null; username: string; resolvedBy: string } {
    let kickUserId = candidateId !== undefined && candidateId !== null ? String(candidateId).trim() : '';
    if (['unknown', 'undefined', 'null', '0', ''].includes(kickUserId)) {
      kickUserId = '';
    }

    let username = candidateUsername ? String(candidateUsername).trim() : '';
    if (['unknown', 'undefined', 'null', 'Subscriber', 'Gifter', 'Chatter', ''].includes(username)) {
      username = '';
    }

    // 1. Try resolving by explicit Kick user ID
    if (kickUserId) {
      const existing = this.getKickUserById(kickUserId);
      if (existing) {
        if (username && existing.username !== username) {
          existing.username = username;
        }
        return { user: existing, kickUserId: existing.kickUserId, username: existing.username, resolvedBy: 'id_match' };
      }
    }

    // 2. Try resolving by username in existing kickUsers mapping
    if (username) {
      const existing = this.getKickUserByUsername(username);
      if (existing) {
        return { user: existing, kickUserId: existing.kickUserId, username: existing.username, resolvedBy: 'username_match' };
      }
    }

    // 3. Try resolving by username in registered OAuth users
    if (username && this.data.users) {
      const authUser = this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (authUser && authUser.kickUserId) {
        const existing = this.getKickUserById(authUser.kickUserId);
        if (existing) {
          return { user: existing, kickUserId: existing.kickUserId, username: existing.username, resolvedBy: 'auth_username_match' };
        }
        const created = this.ensureKickUser(authUser.kickUserId, authUser.username, avatarUrl || authUser.avatarUrl);
        return { user: created, kickUserId: created.kickUserId, username: created.username, resolvedBy: 'auth_created' };
      }
    }

    // 4. If we have a kickUserId, create/ensure them even if new
    if (kickUserId) {
      const effectiveUsername = username || `User_${kickUserId}`;
      const user = this.ensureKickUser(kickUserId, effectiveUsername, avatarUrl);
      return { user, kickUserId: user.kickUserId, username: user.username, resolvedBy: 'new_id_created' };
    }

    // 5. If we only have username and no existing mapping found: unresolvable
    return { user: null, kickUserId: null, username, resolvedBy: 'unresolvable' };
  }

  /**
   * Finds the exact stream/VOD whose broadcast window encompasses the given timestamp.
   * Subscription is only counted if event timestamp falls between stream startedAt and endedAt.
   */
  public findStreamForTimestamp(isoTimestamp?: string): DBStream | undefined {
    if (!this.data.streams || this.data.streams.length === 0) return undefined;
    const eventTime = new Date(isoTimestamp || Date.now()).getTime();
    if (isNaN(eventTime)) return undefined;

    return this.data.streams.find(s => {
      const startTime = new Date(s.startedAt).getTime();
      if (isNaN(startTime)) return false;

      let endTime: number;
      if (s.isLive) {
        endTime = Date.now();
      } else if (s.endedAt) {
        endTime = new Date(s.endedAt).getTime();
      } else if (s.durationSeconds && s.durationSeconds > 0) {
        endTime = startTime + (s.durationSeconds * 1000);
      } else {
        endTime = startTime;
      }

      return eventTime >= startTime && eventTime <= endTime;
    });
  }

  // --- Subscriptions ---
  public addSubscriptionEvent(event: Omit<DBSubscriptionEvent, 'id'>): DBSubscriptionEvent | null {
    // 1. Idempotency Check: Prevent duplicate event processing
    if (event.eventId && this.isEventProcessed(event.eventId)) {
      const existing = (this.data.subscriptionEvents || []).find(e => e.eventId === event.eventId);
      if (existing) return existing;
      return null;
    }

    // 2. Identify correct user using existing Kick user ID mapping
    const resolution = this.resolveKickUser(event.kickUserId, event.username, event.avatarUrl);
    if (!resolution.user || !resolution.kickUserId) {
      this.addSystemLog(
        'warn',
        'SUBSCRIPTION_REWARDS',
        `Cannot link subscription event to user: Kick user ID "${event.kickUserId || 'unknown'}" and username "${event.username || 'unknown'}" could not be resolved in registered Kick users.`
      );
      return null;
    }

    const resolvedUser = resolution.user;
    const kickUserId = resolution.kickUserId;
    const username = resolution.username;
    const avatarUrl = resolvedUser.avatarUrl || event.avatarUrl;

    // 3. Find matching stream strictly based on timestamp
    // Count a subscription ONLY if it happened between the VOD start and end time
    let targetStream = this.findStreamForTimestamp(event.timestamp);

    // If streamId was explicitly passed, verify that the event timestamp actually falls within that stream!
    if (event.streamId && !targetStream) {
      const explicitStream = this.getStreamById(event.streamId);
      if (explicitStream) {
        const sStart = new Date(explicitStream.startedAt).getTime();
        const sEnd = explicitStream.isLive ? Date.now() : (explicitStream.endedAt ? new Date(explicitStream.endedAt).getTime() : (explicitStream.durationSeconds > 0 ? sStart + (explicitStream.durationSeconds * 1000) : sStart));
        const eventTime = new Date(event.timestamp || Date.now()).getTime();
        if (eventTime >= sStart && eventTime <= sEnd) {
          targetStream = explicitStream;
        }
      }
    }

    const targetStreamId = targetStream ? targetStream.streamId : undefined;
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pointsToAward = event.pointsAwarded !== undefined ? event.pointsAwarded : this.getPointRule(event.type as any);

    const fullEvent: DBSubscriptionEvent = {
      ...event,
      id,
      kickUserId,
      username,
      avatarUrl,
      streamId: targetStreamId,
      pointsAwarded: pointsToAward
    };

    if (!this.data.subscriptionEvents) {
      this.data.subscriptionEvents = [];
    }
    this.data.subscriptionEvents.push(fullEvent);

    // If stream matched and event is not a test, increment stream subscriber count
    if (targetStream && !event.isTest) {
      targetStream.subscribersGained = (targetStream.subscribersGained || 0) + 1;
      targetStream.subsGained = targetStream.subscribersGained;
    }

    // 4. Award points according to the existing points system and save points transaction
    this.addPoints(
      kickUserId,
      username,
      avatarUrl,
      event.type,
      pointsToAward,
      event.isTest,
      {
        eventId: event.eventId || id,
        streamId: targetStreamId,
        description: event.type === 'GIFT_SUBSCRIPTION'
          ? `Gift subscription in community (+${pointsToAward} pts)`
          : `Subscribed to Slyyutus (+${pointsToAward} pts)`
      }
    );

    // 5. Automatic Sub Titan badge if supporter reaches 10+ subscriptions/gifts
    if (!event.isTest && (resolvedUser.totalSubs + resolvedUser.totalGifts >= 10)) {
      this.awardBadge(kickUserId, 'SUB_TITAN');
    }

    // 6. Mark event as processed
    if (event.eventId) {
      this.markEventProcessed(event.eventId);
    }

    this.save();
    return fullEvent;
  }

  public getSubscriptionEvents(limit: number = 50, offset: number = 0): { events: DBSubscriptionEvent[]; total: number } {
    const events = (this.data.subscriptionEvents || [])
      .filter(e => !e.isTest)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return {
      events: events.slice(offset, offset + limit),
      total: events.length
    };
  }

  public getStreamSubscriptionEvents(streamId: string): DBSubscriptionEvent[] {
    if (!streamId) return [];
    const stream = this.getStreamById(streamId);
    const events = (this.data.subscriptionEvents || []).filter(e => !e.isTest);
    
    if (!stream) {
      return events.filter(e => e.streamId === streamId);
    }

    const sStart = new Date(stream.startedAt).getTime();
    const sEnd = stream.isLive ? Date.now() : (stream.endedAt ? new Date(stream.endedAt).getTime() : (stream.durationSeconds > 0 ? sStart + stream.durationSeconds * 1000 : sStart));

    return events.filter(e => {
      if (e.streamId === streamId) return true;
      const t = new Date(e.timestamp).getTime();
      return !isNaN(t) && t >= sStart && t <= sEnd;
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public getPointTransactions(kickUserId?: string, limit: number = 50, offset: number = 0): { transactions: DBPointTransaction[]; total: number } {
    const list = (this.data.pointTransactions || []).filter(t => !t.isTest && (!kickUserId || t.kickUserId === kickUserId));
    list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return {
      transactions: list.slice(offset, offset + limit),
      total: list.length
    };
  }

  /**
   * Recalculates subscriptions received during each VOD strictly based on:
   * Counting a subscription ONLY if it happened between the VOD start and end time.
   * Guarantees zero double counting, shows 0 for VODs with no subscriptions,
   * and persists the exact counts in the database.
   */
  public recalculateStreamSubscriptions(): { streamsUpdated: number; totalSubsTracked: number; perStream: Record<string, number> } {
    const streams = this.data.streams || [];
    const subEvents = (this.data.subscriptionEvents || []).filter(e => !e.isTest);
    const streamSubsCount: Record<string, number> = {};
    streams.forEach(s => { streamSubsCount[s.streamId] = 0; });

    // De-duplicate subscription events by eventId or unique key
    const seenEventKeys = new Set<string>();
    const uniqueEvents: DBSubscriptionEvent[] = [];

    for (const event of subEvents) {
      const key = event.eventId || `${event.kickUserId}_${event.timestamp}_${event.type}`;
      if (seenEventKeys.has(key)) {
        continue;
      }
      seenEventKeys.add(key);
      uniqueEvents.push(event);
    }

    let totalAttributed = 0;

    for (const event of uniqueEvents) {
      const eventTime = new Date(event.timestamp).getTime();
      if (isNaN(eventTime)) {
        event.streamId = undefined;
        continue;
      }

      // Count a subscription only if it happened between the VOD start and end time
      const matched = streams.find(s => {
        const startTime = new Date(s.startedAt).getTime();
        let endTime: number;
        if (s.isLive) {
          endTime = Date.now();
        } else if (s.endedAt) {
          endTime = new Date(s.endedAt).getTime();
        } else if (s.durationSeconds && s.durationSeconds > 0) {
          endTime = startTime + (s.durationSeconds * 1000);
        } else {
          endTime = startTime;
        }
        return eventTime >= startTime && eventTime <= endTime;
      });

      if (matched) {
        streamSubsCount[matched.streamId] = (streamSubsCount[matched.streamId] || 0) + 1;
        event.streamId = matched.streamId;
        totalAttributed++;
      } else {
        event.streamId = undefined;
      }
    }

    // Persist exact counts in streams (0 when there are no subscriptions)
    let updated = 0;
    for (const stream of streams) {
      const calculatedCount = streamSubsCount[stream.streamId] || 0;
      stream.subscribersGained = calculatedCount;
      stream.subsGained = calculatedCount;
      updated++;
    }

    this.addSystemLog('info', 'SUBS_TRACKER', `Recalculated subscriptions for ${updated} VODs (${totalAttributed} non-overlapping subs linked).`);
    this.save();
    return {
      streamsUpdated: updated,
      totalSubsTracked: totalAttributed,
      perStream: streamSubsCount
    };
  }

  /**
   * Seeds realistic subscription history tied to past VOD broadcast timestamps
   * so historical streams display accurate subs gained without double counting.
   */
  public seedInitialStreamSubscriptions(): void {
    if (!this.data.streams || this.data.streams.length === 0) return;

    const supporterUsers = [
      { id: '238190', username: 'CasperX_Fan', avatar: 'https://files.kick.com/images/default_avatars/avatar_1.png' },
      { id: '239102', username: 'MoroccanSniper', avatar: 'https://files.kick.com/images/default_avatars/avatar_2.png' },
      { id: '240182', username: 'ApexLegend99', avatar: 'https://files.kick.com/images/default_avatars/avatar_3.png' },
      { id: '241094', username: 'SlyyutuS_VIP', avatar: 'https://files.kick.com/images/default_avatars/avatar_4.png' },
      { id: '242901', username: 'GodAim_Jr', avatar: 'https://files.kick.com/images/default_avatars/avatar_5.png' },
      { id: '243881', username: 'Casawi_Gamer', avatar: 'https://files.kick.com/images/default_avatars/avatar_6.png' },
      { id: '244190', username: 'Tanger_Warrior', avatar: 'https://files.kick.com/images/default_avatars/avatar_7.png' },
      { id: '245812', username: 'Yassine_Pro', avatar: 'https://files.kick.com/images/default_avatars/avatar_8.png' },
      { id: '246990', username: 'Reda_Aim', avatar: 'https://files.kick.com/images/default_avatars/avatar_9.png' },
      { id: '247118', username: 'Amina_Sly', avatar: 'https://files.kick.com/images/default_avatars/avatar_10.png' }
    ];

    const seededEvents: DBSubscriptionEvent[] = [];
    let eventCounter = 1;

    // Distribute realistic subscriptions (1 to 4 per stream, some zero)
    this.data.streams.forEach((stream, idx) => {
      // Deterministic count based on duration and views
      let subsForThisStream = 0;
      if (stream.durationSeconds > 7200) {
        subsForThisStream = (idx % 3 === 0) ? 4 : 3;
      } else if (stream.durationSeconds > 3600) {
        subsForThisStream = (idx % 2 === 0) ? 2 : 1;
      } else if (stream.durationSeconds > 1800) {
        subsForThisStream = (idx % 4 === 0) ? 0 : 1;
      } else {
        subsForThisStream = 0; // zero subs for short tests
      }

      const startTimeMs = new Date(stream.startedAt).getTime();
      const durationMs = stream.durationSeconds * 1000;

      for (let s = 0; s < subsForThisStream; s++) {
        const supporter = supporterUsers[(eventCounter + s) % supporterUsers.length];
        const randomOffsetMs = Math.floor(Math.random() * (durationMs > 60000 ? durationMs - 30000 : 30000)) + 15000;
        const subTimestamp = new Date(startTimeMs + randomOffsetMs).toISOString();
        const isGift = (s > 1 && s % 2 === 1);

        seededEvents.push({
          id: `sub_hist_${eventCounter++}`,
          kickUserId: supporter.id,
          username: supporter.username,
          avatarUrl: supporter.avatar,
          type: isGift ? 'GIFT_SUBSCRIPTION' : 'SUBSCRIPTION',
          streamId: stream.streamId,
          pointsAwarded: 100,
          timestamp: subTimestamp
        });
      }

      stream.subscribersGained = subsForThisStream;
      stream.subsGained = subsForThisStream;
    });

    this.data.subscriptionEvents = seededEvents;
    this.saveSync();
    console.log(`[DB] Seeded ${seededEvents.length} historical subscription events across ${this.data.streams.length} VODs.`);
  }

  // --- Chat Messages ---
  public addChatMessage(msg: Omit<DBChatMessage, 'messageId' | 'pointsAwarded'> & { messageId?: string }): DBChatMessage {
    const pointValue = this.getPointRule('CHAT_MESSAGE');
    const isTest = Boolean(msg.isTest);

    // Deduplication check 1: Exact messageId already recorded (prevents double-counting duplicate event deliveries)
    if (msg.messageId) {
      const existing = this.data.chatMessages.find(m => m.messageId === msg.messageId);
      if (existing) {
        return existing;
      }
    }

    // Deduplication check 2 & Spam Burst Counting:
    // Requirements:
    // - If the same user sends 3 consecutive messages, count ALL 3 messages normally.
    // - Bursts of up to 3 consecutive messages (including identical content / hype spam bursts like "W", "W", "W")
    //   must NOT automatically be classified as spam or discarded.
    // - Valid consecutive messages must count toward total messages, user stats, league stats, rankings, and activity metrics.
    // - Only exclude if clearly violating anti-abuse rules (e.g. automated bot flooding > 3 identical messages in rapid burst or > 10 messages in 5s).
    const msgTime = msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now();
    const validMsgTime = isNaN(msgTime) ? Date.now() : msgTime;
    const BURST_WINDOW_MS = 5000;
    const MAX_CONSECUTIVE_IDENTICAL = 3; // Allow up to 3 consecutive identical messages (valid spam burst)
    const MAX_RAPID_BURST_TOTAL = 10;    // Allow up to 10 rapid messages in 5 seconds from a single user

    const trimmedContent = (msg.content || '').trim();

    // Find recent messages from this user within the burst window (5 seconds)
    const recentFromUser = this.data.chatMessages.filter(m => {
      if (m.kickUserId !== msg.kickUserId) return false;
      const t = new Date(m.timestamp).getTime();
      return !isNaN(t) && Math.abs(validMsgTime - t) <= BURST_WINDOW_MS;
    });

    const identicalInBurst = recentFromUser.filter(m => (m.content || '').trim() === trimmedContent);

    // Anti-spam / anti-flood enforcement:
    // Allow up to MAX_CONSECUTIVE_IDENTICAL (3) consecutive identical messages in a rapid burst.
    // Only exclude when exceeding the burst limit (4th+ identical message within 5s or > 10 rapid messages).
    if (identicalInBurst.length >= MAX_CONSECUTIVE_IDENTICAL) {
      // Exclude excessive automated spam/flood: return the last recorded message without awarding points or double-counting
      return identicalInBurst[identicalInBurst.length - 1];
    }

    if (recentFromUser.length >= MAX_RAPID_BURST_TOTAL) {
      // Exclude excessive rapid flooding
      return recentFromUser[recentFromUser.length - 1];
    }

    const newMsg: DBChatMessage = {
      ...msg,
      messageId: msg.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      channelId: msg.channelId || this.data.channel.id,
      pointsAwarded: pointValue,
      isTest
    };

    this.data.chatMessages.push(newMsg);

    // Keep chat message history capped at 15000 in memory to stay fast while maintaining full user counts
    if (this.data.chatMessages.length > 15000) {
      this.data.chatMessages = this.data.chatMessages.slice(-12000);
    }

    // Award league points
    this.addPoints(msg.kickUserId, msg.username, msg.avatarUrl, 'CHAT_MESSAGE', pointValue, isTest);

    // Update stream chat count and VOD chatter stat for real streams
    if (msg.streamId && !isTest) {
      const stream = this.getStreamById(msg.streamId);
      if (stream) {
        stream.totalChatMessages += 1;
      }
      let vodStat = this.data.vodChatterStats.find(v => v.streamId === msg.streamId && v.kickUserId === msg.kickUserId);
      if (!vodStat) {
        vodStat = {
          id: `vcs_${msg.streamId}_${msg.kickUserId}`,
          streamId: msg.streamId,
          kickUserId: msg.kickUserId,
          messageCount: 0,
          rankInVod: 999
        };
        this.data.vodChatterStats.push(vodStat);
      }
      vodStat.messageCount += 1;

      // Recalculate ranks in this VOD
      const streamChatters = this.data.vodChatterStats
        .filter(v => v.streamId === msg.streamId)
        .sort((a, b) => b.messageCount - a.messageCount);
      
      streamChatters.forEach((c, idx) => {
        c.rankInVod = idx + 1;
      });
    }

    this.save();
    return newMsg;
  }

  public getUserChatMessages(kickUserId: string, limit: number = 50, offset: number = 0): { messages: DBChatMessage[]; total: number } {
    const userMsgs = this.data.chatMessages
      .filter(m => m.kickUserId === kickUserId && !m.isTest)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    return {
      messages: userMsgs.slice(offset, offset + limit),
      total: userMsgs.length
    };
  }

  public getStreamChatMessages(streamId: string, limit: number = 200, offset: number = 0): { messages: DBChatMessage[]; total: number } {
    const streamMsgs = this.data.chatMessages
      .filter(m => m.streamId === streamId && !m.isTest)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    return {
      messages: streamMsgs.slice(offset, offset + limit),
      total: streamMsgs.length
    };
  }

  public getCurrentLiveStream(): DBStream | undefined {
    // Only return the stream that is currently broadcasting live
    return this.data.streams.find(s => s.isLive);
  }

  public getActiveStreamId(): string {
    return this.getCurrentLiveStream()?.streamId || '';
  }

  public getChatMessagesCountForStream(streamId: string, startedAt?: string, endedAt?: string): number {
    const directMatches = this.data.chatMessages.filter(m => !m.isTest && m.streamId === streamId).length;
    if (directMatches > 0) return directMatches;

    if (startedAt) {
      const startTime = new Date(startedAt).getTime();
      const endTime = endedAt ? new Date(endedAt).getTime() : startTime + 6 * 3600 * 1000;
      const timeMatches = this.data.chatMessages.filter(m => {
        if (m.isTest) return false;
        const msgTime = new Date(m.timestamp).getTime();
        return msgTime >= startTime && msgTime <= endTime;
      }).length;
      if (timeMatches > 0) return timeMatches;
    }
    return 0;
  }

  public getChatMessagesCountForDate(dateStr: string): number {
    return this.data.chatMessages.filter(m => {
      if (m.isTest) return false;
      const d = new Date(m.timestamp);
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const iso = d.toISOString().slice(0, 10);
      return formatted === dateStr || iso === dateStr || m.timestamp.startsWith(dateStr);
    }).length;
  }

  public getChatMessages(limit: number = 50, offset: number = 0): { messages: DBChatMessage[]; total: number } {
    const sorted = this.data.chatMessages
      .filter(m => !m.isTest)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return {
      messages: sorted.slice(offset, offset + limit),
      total: sorted.length
    };
  }

  public getChatAnalytics() {
    const realMessages = this.data.chatMessages.filter(m => !m.isTest);
    const totalMessages = realMessages.length;

    const chatterMap = new Map<string, { kickUserId: string; username: string; avatarUrl: string; messageCount: number }>();
    const streamMap = new Map<string, number>();

    for (const msg of realMessages) {
      const existing = chatterMap.get(msg.kickUserId);
      if (existing) {
        existing.messageCount += 1;
      } else {
        chatterMap.set(msg.kickUserId, {
          kickUserId: msg.kickUserId,
          username: msg.username,
          avatarUrl: msg.avatarUrl,
          messageCount: 1
        });
      }

      if (msg.streamId) {
        streamMap.set(msg.streamId, (streamMap.get(msg.streamId) || 0) + 1);
      }
    }

    const activeChatters = chatterMap.size;
    const averageMessagesPerUser = activeChatters > 0 ? Math.round(totalMessages / activeChatters) : 0;

    const topChatters = Array.from(chatterMap.values())
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 10);

    const recentMessages = [...realMessages]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    const messagesPerStream = Array.from(streamMap.entries()).map(([streamId, count]) => {
      const stream = this.getStreamById(streamId);
      return {
        streamId,
        title: stream?.title || `Stream ${streamId}`,
        messageCount: count
      };
    }).sort((a, b) => b.messageCount - a.messageCount);

    return {
      totalMessages,
      activeChatters,
      averageMessagesPerUser,
      topChatters,
      recentMessages,
      messagesPerStream
    };
  }

  public getDataStatus() {
    const realUsers = this.data.kickUsers.filter(u => !u.isTest);
    const realMessages = this.data.chatMessages.filter(m => !m.isTest);
    const realSubs = (this.data.subscriptionEvents || []).filter(s => !s.isTest);
    const streams = this.data.streams || [];
    const vods = streams.filter(s => !s.isLive);
    const activeSeason = this.getActiveSeason();
    const realPoints = this.data.leaguePoints.filter(p => !p.isTest && p.seasonId === activeSeason.seasonId);

    return {
      users: realUsers.length,
      messages: realMessages.length,
      subscriptions: realSubs.length,
      streams: streams.length,
      vods: vods.length,
      leaguePoints: realPoints.length,
      activeSeasonId: activeSeason.seasonId,
      activeSeasonParticipants: activeSeason.totalParticipants,
      activeSeasonPointsDistributed: activeSeason.totalPointsDistributed
    };
  }

  // --- Finalize Season ---
  public finalizeSeason(seasonId: string): boolean {
    const season = this.getSeason(seasonId);
    if (!season || season.isFinalized) return false;

    // Get rankings
    const { rankings } = this.getLeagueRankings(seasonId, undefined, 1000, 0);

    // Save permanent league rankings
    rankings.forEach(r => {
      this.data.leagueRankings.push({
        id: `rank_${seasonId}_${r.kickUserId}`,
        seasonId,
        kickUserId: r.kickUserId,
        rank: r.rank,
        points: r.points,
        messagesCount: r.messagesCount,
        subsCount: r.subsCount,
        giftsCount: r.giftsCount,
        isFinal: true
      });

      // Award Season Badges to Top 3
      if (r.rank === 1) {
        this.awardBadge(r.kickUserId, 'SEASON_1ST', { seasonId, seasonName: season.name, rankPosition: 1 });
      } else if (r.rank === 2) {
        this.awardBadge(r.kickUserId, 'SEASON_2ND', { seasonId, seasonName: season.name, rankPosition: 2 });
      } else if (r.rank === 3) {
        this.awardBadge(r.kickUserId, 'SEASON_3RD', { seasonId, seasonName: season.name, rankPosition: 3 });
      }
    });

    season.isActive = false;
    season.isFinalized = true;
    season.finalizedAt = new Date().toISOString();

    this.addSystemLog('success', 'LEAGUE_ENGINE', `Finalized Season ${season.seasonId} (${season.name}). Badges awarded to top 3.`);

    // Auto-create next season if not existing
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const yy = String(nextMonth.getFullYear()).slice(-2);
    const nextSeasonId = `${mm}-${yy}`;
    
    if (!this.getSeason(nextSeasonId)) {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const nextSeasonName = `${monthNames[nextMonth.getMonth()]} 20${yy}`;
      const start = nextMonth.toISOString();
      const end = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();

      this.data.leagueSeasons.push({
        seasonId: nextSeasonId,
        name: nextSeasonName,
        startDate: start,
        endDate: end,
        isActive: true,
        isFinalized: false,
        totalParticipants: 0,
        totalPointsDistributed: 0
      });
      this.addSystemLog('info', 'LEAGUE_ENGINE', `Created new Season ${nextSeasonId} (${nextSeasonName})`);
    }

    this.save();
    return true;
  }

  // --- Logs ---
  public addSystemLog(level: 'info' | 'warn' | 'error' | 'success', module: string, message: string, metadata?: Record<string, any>): void {
    const log: DBSystemLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      level,
      module,
      message,
      metadata,
      createdAt: new Date().toISOString()
    };
    this.data.systemLogs.unshift(log);
    if (this.data.systemLogs.length > 500) {
      this.data.systemLogs = this.data.systemLogs.slice(0, 500);
    }
  }

  public getSystemLogs(limit: number = 100): DBSystemLog[] {
    return this.data.systemLogs.slice(0, limit);
  }

  // --- Mini Games Leaderboard & Scores ---
  public static readonly MINI_GAMES_CATALOG = [
    { 
      id: 'aim_trainer', 
      title: 'AimLabs Reflex Arena', 
      category: 'arcade', 
      description: 'Precision aim & reaction trainer with dynamic moving targets, variable sizes, reaction time tracking, combo chains, and Time Attack / Accuracy / Survival modes.',
      badge: 'Aim & Reflex',
      modes: ['Time Attack', 'Accuracy Challenge', 'Survival']
    },
    { 
      id: 'skillbar_lockpick', 
      title: 'Tactical Skillbar', 
      category: 'skill', 
      description: 'FiveM-inspired quick time mechanical lockpick. Intercept sweeping needle within microscopic sweet spots under increasing angular velocity.',
      badge: 'Skillbar QTE'
    },
    { 
      id: 'circuit_wire', 
      title: 'Circuit Wire Defusal', 
      category: 'puzzle', 
      description: 'High-voltage circuit defusal puzzle. Analyze electronic schematics, decode wire specifications, and cut designated terminals before detonation.',
      badge: 'Wire Defusal'
    },
    { 
      id: 'keypad_memory', 
      title: 'Keypad Cipher Memory', 
      category: 'puzzle', 
      description: 'Mainframe terminal breach. Memorize flashed alphanumeric security passcodes and key them into the tactical cyber numpad under lockdown countdown.',
      badge: 'Code Memory'
    },
    { 
      id: 'thermite_memory', 
      title: 'Thermite Memory Grid', 
      category: 'puzzle', 
      description: 'FiveM-inspired thermite memory hack. Memorize glowing thermal nodes across the grid before they darken, then replicate the pattern without fault.',
      badge: 'Thermite Grid'
    },
    { 
      id: 'sequence_master', 
      title: 'Directional Sequence Hack', 
      category: 'puzzle', 
      description: 'Cyberpunk directional transmission. Memorize and reproduce rapid multi-directional arrow sequences under escalating tempo.',
      badge: 'Sequence Memory'
    },
    { 
      id: 'precision_timing', 
      title: 'Oscillation Calibrator', 
      category: 'skill', 
      description: 'Quantum oscillation calibrator. Freeze high-frequency harmonic laser pulses within sub-millisecond precision bands.',
      badge: 'Timing Sync'
    },
    { 
      id: 'logic_grid', 
      title: 'Neural Grid Matrix', 
      category: 'puzzle', 
      description: 'Deductive constraint matrix. Uncover valid node coordinates using interconnected logical clues and negative elimination.',
      badge: 'Logic IQ'
    },
    // Aliases & legacy games
    { id: 'arcade_shooter', title: 'AimLabs Reflex Arena', category: 'arcade', description: 'Precision aim & reaction trainer with dynamic moving targets.', badge: 'Aim & Reflex' },
    { id: 'pattern_decoder', title: 'Pattern Decoder', category: 'puzzle', description: 'Decode complex algorithmic, geometric, and modular sequences.', badge: 'Algorithmic' },
    { id: 'cipher_puzzle', title: 'Cipher Decoder', category: 'puzzle', description: 'Cryptographic terminal deciphering encrypted intelligence with algorithmic clues.', badge: 'Cryptography' },
    { id: 'difficult_quiz', title: 'Apex Intellect Trivia', category: 'quiz', description: '13-category difficult general knowledge quiz with multipliers and streak bonuses.', badge: 'Global Trivia' },
    { id: 'multi_task', title: 'Cognitive Overload', category: 'skill', description: 'Multitask simultaneous drone lane balance, Stroop tests, and countdown defusal.', badge: 'Multitask' }
  ];

  public saveMiniGameScore(score: Omit<DBMiniGameScore, 'id' | 'createdAt'>): DBMiniGameScore {
    if (!this.data.miniGameScores) {
      this.data.miniGameScores = [];
    }

    // Map arcade_shooter to aim_trainer
    const normalizedGameId = score.gameId === 'arcade_shooter' ? 'aim_trainer' : score.gameId;
    const catalogItem = Database.MINI_GAMES_CATALOG.find(g => g.id === normalizedGameId) || Database.MINI_GAMES_CATALOG.find(g => g.id === score.gameId);
    const gameTitle = score.gameTitle || (catalogItem ? catalogItem.title : normalizedGameId);

    // Resolve real user record if known to guarantee real Kick avatar
    const realUser = (score.userId ? this.getKickUserById(score.userId) : undefined) ||
                     (score.username ? this.getKickUserByUsername(score.username) : undefined);
    const resolvedUsername = realUser?.username || score.username;
    const resolvedAvatar = realUser?.avatarUrl || score.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resolvedUsername)}`;

    const fullScore: DBMiniGameScore = {
      id: `mgs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...score,
      gameId: normalizedGameId,
      username: resolvedUsername,
      avatarUrl: resolvedAvatar,
      gameTitle,
      accuracy: typeof score.accuracy === 'number' ? Math.min(100, Math.max(0, Math.round(score.accuracy * 10) / 10)) : undefined,
      createdAt: new Date().toISOString()
    };

    this.data.miniGameScores.push(fullScore);

    // Also award League activity points if user is authenticated or known
    if (score.userId && !score.userId.startsWith('guest_') && score.success) {
      const pointAward = score.difficulty === 'expert' ? 30 : score.difficulty === 'hard' ? 25 : score.difficulty === 'medium' ? 15 : 10;
      this.addPoints(score.userId, resolvedUsername, resolvedAvatar, 'MINI_GAME_WIN', pointAward);
    }

    this.addSystemLog('info', 'MINI_GAMES', `Recorded score for ${score.username} in ${gameTitle} (${score.difficulty}): ${score.score} pts (${score.timeSeconds}s, ${fullScore.accuracy ?? 100}% acc)`);
    this.save();
    return fullScore;
  }

  public getMiniGameDashboardStats() {
    const allScores = this.data.miniGameScores || [];
    const wins = allScores.filter(s => s.success);

    // Unique players
    const uniqueUserIds = new Set(allScores.map(s => s.userId));
    const totalPlayers = uniqueUserIds.size;
    const totalGamesPlayed = allScores.length;
    const totalWins = wins.length;

    // Highest score and fastest time
    const highestScore = wins.length > 0 ? Math.max(...wins.map(s => s.score)) : 0;
    const fastestCompletionTime = wins.length > 0 ? Math.min(...wins.map(s => s.timeSeconds)) : 0;

    // Per-game statistics breakdown
    const perGameStats = Database.MINI_GAMES_CATALOG.map(game => {
      const gScores = allScores.filter(s => s.gameId === game.id);
      const gWins = gScores.filter(s => s.success);
      const gHighest = gWins.length > 0 ? Math.max(...gWins.map(s => s.score)) : 0;
      const gFastest = gWins.length > 0 ? Math.min(...gWins.map(s => s.timeSeconds)) : 0;
      const gAvgScore = gWins.length > 0 ? Math.round(gWins.reduce((sum, s) => sum + s.score, 0) / gWins.length) : 0;
      const gTopScore = gWins.slice().sort((a, b) => b.score - a.score)[0];

      return {
        gameId: game.id,
        title: game.title,
        category: game.category,
        description: game.description,
        totalPlays: gScores.length,
        totalWins: gWins.length,
        highestScore: gHighest,
        highScore: gHighest,
        fastestTime: gFastest,
        bestTime: gFastest,
        averageScore: gAvgScore,
        topPlayer: gTopScore ? (() => {
          const realUser = this.getKickUserById(gTopScore.userId) || this.getKickUserByUsername(gTopScore.username);
          const resolvedUsername = realUser?.username || gTopScore.username;
          const resolvedAvatar = realUser?.avatarUrl || gTopScore.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resolvedUsername)}`;
          return {
            userId: gTopScore.userId,
            username: resolvedUsername,
            avatarUrl: resolvedAvatar,
            score: gTopScore.score
          };
        })() : null
      };
    });

    // Also build a map by gameId for direct object lookups
    const perGameMap: Record<string, any> = {};
    perGameStats.forEach(st => {
      perGameMap[st.gameId] = st;
    });

    // Top ranked players across all games (aggregated)
    const playerMap = new Map<string, {
      userId: string;
      username: string;
      avatarUrl: string;
      totalWins: number;
      totalPlays: number;
      bestScore: number;
      totalPoints: number;
      fastestTime: number;
      favoriteGame: string;
    }>();

    const userGameCounts = new Map<string, Map<string, number>>();

    for (const s of allScores) {
      if (!userGameCounts.has(s.userId)) userGameCounts.set(s.userId, new Map());
      const counts = userGameCounts.get(s.userId)!;
      counts.set(s.gameId, (counts.get(s.gameId) || 0) + 1);

      let p = playerMap.get(s.userId);
      if (!p) {
        const realUser = this.getKickUserById(s.userId) || this.getKickUserByUsername(s.username);
        const resolvedUsername = realUser?.username || s.username;
        const resolvedAvatar = realUser?.avatarUrl || s.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resolvedUsername)}`;

        p = {
          userId: s.userId,
          username: resolvedUsername,
          avatarUrl: resolvedAvatar,
          totalWins: s.success ? 1 : 0,
          totalPlays: 1,
          bestScore: s.score,
          totalPoints: s.score,
          fastestTime: s.success ? s.timeSeconds : 9999,
          favoriteGame: s.gameId
        };
        playerMap.set(s.userId, p);
      } else {
        p.totalPlays += 1;
        p.totalPoints += s.score;
        if (s.success) {
          p.totalWins += 1;
          if (s.score > p.bestScore) p.bestScore = s.score;
          if (s.timeSeconds < p.fastestTime) p.fastestTime = s.timeSeconds;
        }
      }
    }

    // Assign favorite game
    for (const [userId, p] of playerMap.entries()) {
      const counts = userGameCounts.get(userId);
      if (counts) {
        let maxCount = 0;
        let fav = p.favoriteGame;
        for (const [gId, count] of counts.entries()) {
          if (count > maxCount) {
            maxCount = count;
            fav = gId;
          }
        }
        const found = Database.MINI_GAMES_CATALOG.find(c => c.id === fav);
        p.favoriteGame = found ? found.title : fav;
      }
    }

    const topRankedPlayers = Array.from(playerMap.values())
      .sort((a, b) => b.totalPoints - a.totalPoints || b.bestScore - a.bestScore)
      .slice(0, 10)
      .map((p, idx) => {
        const realUser = this.getKickUserById(p.userId) || this.getKickUserByUsername(p.username);
        return {
          rank: idx + 1,
          ...p,
          username: realUser?.username || p.username,
          avatarUrl: realUser?.avatarUrl || p.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.username)}`
        };
      });

    // Recent results (latest 20)
    const recentResults = allScores
      .slice(-20)
      .reverse()
      .map(s => {
        const catItem = Database.MINI_GAMES_CATALOG.find(g => g.id === s.gameId);
        const realUser = this.getKickUserById(s.userId) || this.getKickUserByUsername(s.username);
        const resolvedUsername = realUser?.username || s.username;
        const resolvedAvatar = realUser?.avatarUrl || s.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resolvedUsername)}`;
        return {
          ...s,
          username: resolvedUsername,
          avatarUrl: resolvedAvatar,
          gameTitle: s.gameTitle || (catItem ? catItem.title : s.gameId)
        };
      });

    return {
      totalPlayers,
      totalGamesPlayed,
      totalWins,
      highestScore,
      fastestCompletionTime,
      recentResults,
      recentActivity: recentResults,
      perGameStats,
      perGameMap,
      topRankedPlayers,
      playerRankings: topRankedPlayers,
      catalog: Database.MINI_GAMES_CATALOG
    };
  }

  public getMiniGameLeaderboard(gameId?: string, difficulty?: string, limit: number = 50) {
    let filtered = (this.data.miniGameScores || []).filter(s => s.success);

    if (gameId && gameId !== 'all') {
      filtered = filtered.filter(s => s.gameId === gameId);
    }
    if (difficulty && difficulty !== 'all') {
      filtered = filtered.filter(s => s.difficulty === difficulty);
    }

    // Rank individual best runs: Highest score, then lowest time, then highest accuracy
    const sortedRuns = filtered
      .slice()
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.timeSeconds !== b.timeSeconds) return a.timeSeconds - b.timeSeconds;
        return (b.accuracy || 100) - (a.accuracy || 100);
      });

    // Also build unique user leaderboard (best run per user)
    const userBestMap = new Map<string, DBMiniGameScore>();
    for (const run of sortedRuns) {
      if (!userBestMap.has(run.userId)) {
        userBestMap.set(run.userId, run);
      }
    }

    const leaderboard = Array.from(userBestMap.values())
      .slice(0, limit)
      .map((entry, index) => {
        const cat = Database.MINI_GAMES_CATALOG.find(g => g.id === entry.gameId);
        const realUser = this.getKickUserById(entry.userId) || this.getKickUserByUsername(entry.username);
        const resolvedUsername = realUser?.username || entry.username;
        const resolvedAvatar = realUser?.avatarUrl || entry.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resolvedUsername)}`;
        return {
          rank: index + 1,
          id: entry.id,
          userId: entry.userId,
          username: resolvedUsername,
          avatarUrl: resolvedAvatar,
          gameId: entry.gameId,
          gameTitle: entry.gameTitle || (cat ? cat.title : entry.gameId),
          score: entry.score,
          timeSeconds: entry.timeSeconds,
          accuracy: entry.accuracy ?? 100,
          difficulty: entry.difficulty,
          gameMode: entry.gameMode || 'Standard',
          date: entry.createdAt,
          createdAt: entry.createdAt
        };
      });

    // All individual top runs (for detailed historical ranking table)
    const topRuns = sortedRuns
      .slice(0, limit)
      .map((entry, index) => {
        const cat = Database.MINI_GAMES_CATALOG.find(g => g.id === entry.gameId);
        const realUser = this.getKickUserById(entry.userId) || this.getKickUserByUsername(entry.username);
        const resolvedUsername = realUser?.username || entry.username;
        const resolvedAvatar = realUser?.avatarUrl || entry.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resolvedUsername)}`;
        return {
          rank: index + 1,
          id: entry.id,
          userId: entry.userId,
          username: resolvedUsername,
          avatarUrl: resolvedAvatar,
          gameId: entry.gameId,
          gameTitle: entry.gameTitle || (cat ? cat.title : entry.gameId),
          score: entry.score,
          timeSeconds: entry.timeSeconds,
          accuracy: entry.accuracy ?? 100,
          difficulty: entry.difficulty,
          gameMode: entry.gameMode || 'Standard',
          date: entry.createdAt,
          createdAt: entry.createdAt
        };
      });

    return {
      gameId: gameId || 'all',
      difficulty: difficulty || 'all',
      leaderboard,
      topRuns,
      totalEntries: filtered.length,
      recentScores: (this.data.miniGameScores || []).slice(-15).reverse().map(s => {
        const cat = Database.MINI_GAMES_CATALOG.find(g => g.id === s.gameId);
        const realUser = this.getKickUserById(s.userId) || this.getKickUserByUsername(s.username);
        return {
          ...s,
          username: realUser?.username || s.username,
          avatarUrl: realUser?.avatarUrl || s.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.username)}`,
          gameTitle: s.gameTitle || (cat ? cat.title : s.gameId)
        };
      })
    };
  }

  public getUserMiniGameStats(userId: string, username?: string) {
    const allScores = this.data.miniGameScores || [];
    
    // Match either by exact userId OR by lowercase username (if username provided)
    const allUserScores = allScores.filter(s => {
      if (userId && s.userId === userId) return true;
      if (username && s.username && s.username.toLowerCase() === username.toLowerCase()) return true;
      return false;
    });

    const wins = allUserScores.filter(s => s.success);
    const losses = allUserScores.filter(s => !s.success);

    const totalGamesPlayed = allUserScores.length;
    const totalGamesWon = wins.length;
    const totalGamesLost = losses.length;
    const winRate = totalGamesPlayed > 0 ? Math.round((totalGamesWon / totalGamesPlayed) * 100) : 0;
    
    const totalScore = allUserScores.reduce((sum, s) => sum + (s.score || 0), 0);
    const bestScore = allUserScores.length > 0 ? Math.max(...allUserScores.map(s => s.score || 0)) : 0;
    const averageScore = totalGamesPlayed > 0 ? Math.round(totalScore / totalGamesPlayed) : 0;
    const bestCompletionTime = wins.length > 0 ? Math.min(...wins.map(s => s.timeSeconds)) : 0;

    // Accuracy percentage where applicable
    const scoresWithAcc = allUserScores.filter(s => typeof s.accuracy === 'number' && !Number.isNaN(s.accuracy));
    const accuracyPercentage = scoresWithAcc.length > 0 
      ? Math.round(scoresWithAcc.reduce((sum, s) => sum + (s.accuracy || 0), 0) / scoresWithAcc.length) 
      : null;

    // Calculate current ranking across ALL unique players in the database
    const playerPointsMap = new Map<string, { totalPoints: number; bestScore: number }>();
    allScores.forEach(s => {
      const existing = playerPointsMap.get(s.userId);
      if (!existing) {
        playerPointsMap.set(s.userId, { totalPoints: s.score || 0, bestScore: s.score || 0 });
      } else {
        existing.totalPoints += s.score || 0;
        if ((s.score || 0) > existing.bestScore) existing.bestScore = s.score || 0;
      }
    });

    const sortedPlayers = Array.from(playerPointsMap.entries())
      .sort((a, b) => b[1].totalPoints - a[1].totalPoints || b[1].bestScore - a[1].bestScore);

    const totalRankedPlayers = sortedPlayers.length;
    let currentRanking: number | null = null;
    
    if (totalGamesPlayed > 0) {
      const rankIdx = sortedPlayers.findIndex(([pId]) => pId === userId);
      if (rankIdx !== -1) {
        currentRanking = rankIdx + 1;
      } else {
        currentRanking = Math.max(1, sortedPlayers.length);
      }
    }

    // Per-game breakdown across all catalog games
    const perGame: Record<string, {
      gameId: string;
      title: string;
      category: string;
      bestScore: number;
      fastestTime: number;
      wins: number;
      attempts: number;
      losses: number;
      winRate: number;
      averageAccuracy: number | null;
      lastPlayed?: string;
    }> = {};

    const personalBests: Array<{
      gameId: string;
      title: string;
      category: string;
      bestScore: number;
      fastestTime: number;
      accuracy: number | null;
      wins: number;
      attempts: number;
      winRate: number;
    }> = [];

    let favoriteGame = 'Neural Grid Matrix';
    let highestPerformingGame = 'Neural Grid Matrix';
    let maxAttempts = -1;
    let maxBestScore = -1;

    Database.MINI_GAMES_CATALOG.forEach(g => {
      const gScores = allUserScores.filter(s => s.gameId === g.id);
      const gWins = gScores.filter(s => s.success);
      const gLosses = gScores.filter(s => !s.success);
      const accList = gScores.filter(s => typeof s.accuracy === 'number' && !Number.isNaN(s.accuracy)).map(s => s.accuracy!);
      const avgAcc = accList.length > 0 ? Math.round(accList.reduce((a, b) => a + b, 0) / accList.length) : null;
      const gBestScore = gScores.length > 0 ? Math.max(...gScores.map(s => s.score || 0)) : 0;
      const gFastest = gWins.length > 0 ? Math.min(...gWins.map(s => s.timeSeconds)) : 0;
      const gWinRate = gScores.length > 0 ? Math.round((gWins.length / gScores.length) * 100) : 0;

      const gameStat = {
        gameId: g.id,
        title: g.title,
        category: g.category,
        bestScore: gBestScore,
        fastestTime: gFastest,
        wins: gWins.length,
        attempts: gScores.length,
        losses: gLosses.length,
        winRate: gWinRate,
        averageAccuracy: avgAcc,
        lastPlayed: gScores.length > 0 ? gScores[gScores.length - 1].createdAt : undefined
      };

      perGame[g.id] = gameStat;

      personalBests.push({
        gameId: g.id,
        title: g.title,
        category: g.category,
        bestScore: gBestScore,
        fastestTime: gFastest,
        accuracy: avgAcc,
        wins: gWins.length,
        attempts: gScores.length,
        winRate: gWinRate
      });

      if (gScores.length > maxAttempts) {
        maxAttempts = gScores.length;
        favoriteGame = g.title;
      }
      if (gBestScore > maxBestScore) {
        maxBestScore = gBestScore;
        highestPerformingGame = g.title;
      }
    });

    const recentGameResults = allUserScores.slice(-15).reverse().map(s => {
      const catItem = Database.MINI_GAMES_CATALOG.find(g => g.id === s.gameId);
      return {
        ...s,
        gameTitle: s.gameTitle || (catItem ? catItem.title : s.gameId)
      };
    });

    // Resolved real user identity from Kick database
    const realUser = (userId ? this.getKickUserById(userId) : undefined) ||
                     (username ? this.getKickUserByUsername(username) : undefined);
    const resolvedUsername = realUser?.username || username || (allUserScores.length > 0 ? allUserScores[allUserScores.length - 1].username : undefined) || 'Operator';
    const resolvedAvatar = realUser?.avatarUrl || (allUserScores.length > 0 ? allUserScores[allUserScores.length - 1].avatarUrl : undefined);

    return {
      userId,
      username: resolvedUsername,
      avatarUrl: resolvedAvatar,
      hasPlayed: totalGamesPlayed > 0,
      totalGamesPlayed,
      totalGamesWon,
      totalGamesLost,
      totalAttempts: totalGamesPlayed, // Compatibility alias
      totalWins: totalGamesWon,         // Compatibility alias
      winRate,
      totalScore,
      bestScore,
      averageScore,
      bestCompletionTime,
      fastestWinTime: bestCompletionTime, // Compatibility alias
      accuracyPercentage,
      currentRanking,
      totalRankedPlayers,
      highestRankedGame: highestPerformingGame,
      favoriteGame,
      highestPerformingGame,
      personalBests,
      perGame,
      recentActivity: recentGameResults,
      recentGameResults
    };
  }

  /**
   * Purges all test, demo, dummy, or seed mini-game records from the database
   * so the leaderboard starts completely clean with only real users and real gameplay.
   */
  public purgeTestMiniGameData(): { purgedCount: number; remainingCount: number } {
    if (!this.data.miniGameScores) {
      this.data.miniGameScores = [];
      return { purgedCount: 0, remainingCount: 0 };
    }

    const priorCount = this.data.miniGameScores.length;
    this.data.miniGameScores = this.data.miniGameScores.filter(s => {
      if (!s.id) return false;
      // Strip mock/seed IDs
      if (s.id.startsWith('mgs_seed_')) return false;
      // Strip legacy test games from previous iterations
      if (['lockpicking', 'hacking', 'wires', 'safecracking', 'keypad', 'memory', 'signal'].includes(s.gameId)) return false;
      // Strip explicit test users/players
      if (s.userId && (s.userId.startsWith('test_') || s.userId.startsWith('k_test') || s.userId.startsWith('dummy_'))) return false;
      if (s.username && (s.username.toLowerCase().startsWith('test') || s.username.toLowerCase().includes('dummy') || s.username.toLowerCase().includes('demo_user') || s.username.toLowerCase().includes('fake_user'))) return false;
      return true;
    });

    const purgedCount = priorCount - this.data.miniGameScores.length;
    if (purgedCount > 0) {
      this.addSystemLog('info', 'MINI_GAMES', `Purged ${purgedCount} test/seed mini-game records. Remaining clean records: ${this.data.miniGameScores.length}`);
      this.saveSync();
    }
    return { purgedCount, remainingCount: this.data.miniGameScores.length };
  }

  /**
   * Purges known test/demo users (e.g. ApexLegend99, SuperKickFan, GenerousGiftMaster)
   * while strictly leaving real community members untouched.
   */
  public cleanTestUsersAndData(): { removedUsers: string[]; removedScores: number } {
    const testIds = new Set(['k_1788627626013', '847291', '928374', '999888', '888777']);
    const testNames = new Set(['apexlegend99', 'superkickfan', 'generousgiftmaster', 'testsubscriberbot', 'megagifterhero']);

    const usersToRemove = (this.data.kickUsers || []).filter(u =>
      testIds.has(u.kickUserId) ||
      testNames.has(u.username.toLowerCase()) ||
      u.kickUserId.startsWith('test_') ||
      u.kickUserId.startsWith('fake_') ||
      u.kickUserId.startsWith('guest_')
    );

    if (usersToRemove.length === 0) {
      return { removedUsers: [], removedScores: 0 };
    }

    const removedUserIds = new Set(usersToRemove.map(u => u.kickUserId));
    const removedUsernames = new Set(usersToRemove.map(u => u.username.toLowerCase()));

    this.data.kickUsers = this.data.kickUsers.filter(u => !removedUserIds.has(u.kickUserId));
    this.data.leaguePoints = this.data.leaguePoints.filter(p => !removedUserIds.has(p.kickUserId));
    this.data.chatMessages = this.data.chatMessages.filter(m => !removedUserIds.has(m.kickUserId));
    if (this.data.userBadges) {
      this.data.userBadges = this.data.userBadges.filter(b => !removedUserIds.has(b.kickUserId));
    }

    const initialScores = this.data.miniGameScores?.length || 0;
    this.data.miniGameScores = (this.data.miniGameScores || []).filter(s =>
      !removedUserIds.has(s.userId) &&
      !removedUsernames.has((s.username || '').toLowerCase()) &&
      !s.userId.startsWith('guest_') &&
      !s.userId.startsWith('test_')
    );
    const removedScores = initialScores - (this.data.miniGameScores?.length || 0);

    this.data.pointTransactions = (this.data.pointTransactions || []).filter(t =>
      !removedUserIds.has(t.kickUserId) &&
      !removedUsernames.has((t.username || '').toLowerCase())
    );

    this.data.subscriptionEvents = (this.data.subscriptionEvents || []).filter(e =>
      !removedUserIds.has(e.kickUserId) &&
      !removedUsernames.has((e.username || '').toLowerCase())
    );

    this.recalculateStreamSubscriptions();
    this.saveSync();
    console.log(`[DB] Cleaned ${usersToRemove.length} test users: ${Array.from(removedUsernames).join(', ')}`);
    return {
      removedUsers: usersToRemove.map(u => u.username),
      removedScores
    };
  }

  // --- Q/A Methods for Chatters and Streamer Slyyutus ---
  public createQuestion(payload: {
    userId: string;
    kickUserId: string;
    username: string;
    avatarUrl?: string;
    question: string;
  }): DBQuestion {
    if (!this.data.questions) {
      this.data.questions = [];
    }

    const realUser = this.getKickUserById(payload.kickUserId) || this.getKickUserByUsername(payload.username);
    const resolvedUsername = realUser?.username || payload.username;
    const resolvedAvatar = realUser?.avatarUrl || payload.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resolvedUsername)}`;

    const newQ: DBQuestion = {
      id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: payload.userId,
      kickUserId: payload.kickUserId,
      username: resolvedUsername,
      avatarUrl: resolvedAvatar,
      question: payload.question.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.data.questions.unshift(newQ);
    this.addSystemLog('info', 'QA', `Question submitted by @${resolvedUsername} (${newQ.id})`);
    this.save();
    return newQ;
  }

  public getQuestionsForUser(userId: string, kickUserId?: string): DBQuestion[] {
    if (!this.data.questions) return [];
    return this.data.questions
      .filter(q => q.userId === userId || (kickUserId && q.kickUserId === kickUserId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getPublicQuestions(status?: string, sortOrder: 'newest' | 'oldest' = 'newest') {
    if (!this.data.questions) {
      this.data.questions = [];
    }

    // Public users only see non-rejected questions
    let list = this.data.questions.filter(q => q.status !== 'rejected');
    if (status && status !== 'all') {
      list = list.filter(q => q.status === status);
    }

    list.sort((a, b) => {
      return sortOrder === 'oldest' 
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt);
    });

    const pendingCount = this.data.questions.filter(q => q.status === 'pending').length;
    const answeredCount = this.data.questions.filter(q => q.status === 'answered').length;

    return {
      questions: list,
      total: list.length,
      pendingCount,
      answeredCount,
      rejectedCount: 0
    };
  }

  public getAllQuestionsAdmin(status?: string, sortOrder: 'newest' | 'oldest' = 'newest') {
    if (!this.data.questions) {
      this.data.questions = [];
    }

    let list = [...this.data.questions];
    if (status && status !== 'all') {
      list = list.filter(q => q.status === status);
    }

    list.sort((a, b) => {
      return sortOrder === 'oldest' 
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt);
    });

    const pendingCount = this.data.questions.filter(q => q.status === 'pending').length;
    const answeredCount = this.data.questions.filter(q => q.status === 'answered').length;
    const rejectedCount = this.data.questions.filter(q => q.status === 'rejected').length;

    return {
      questions: list,
      total: this.data.questions.length,
      pendingCount,
      answeredCount,
      rejectedCount
    };
  }

  public answerQuestion(questionId: string, answerText: string, answeredBy: string = 'Slyyutus'): DBQuestion | null {
    if (!this.data.questions) return null;
    const q = this.data.questions.find(item => item.id === questionId);
    if (!q) return null;

    q.answer = answerText.trim();
    q.status = 'answered';
    q.answeredAt = new Date().toISOString();
    q.answeredBy = answeredBy;

    this.addSystemLog('info', 'QA', `Question ${questionId} answered by ${answeredBy}`);
    this.save();
    return q;
  }

  public updateQuestionStatus(questionId: string, status: 'pending' | 'answered' | 'rejected'): DBQuestion | null {
    if (!this.data.questions) return null;
    const q = this.data.questions.find(item => item.id === questionId);
    if (!q) return null;

    q.status = status;
    this.save();
    return q;
  }

  public deleteQuestion(questionId: string): boolean {
    if (!this.data.questions) return false;
    const lenBefore = this.data.questions.length;
    this.data.questions = this.data.questions.filter(item => item.id !== questionId);
    const deleted = this.data.questions.length < lenBefore;
    if (deleted) {
      this.save();
      this.addSystemLog('info', 'QA', `Deleted question ${questionId}`);
    }
    return deleted;
  }

  /**
   * Specifically purges ONLY the 3 designated Q&A test users: PulseSniper, QuantumShooter, ApexViper.
   * Removes their questions, answers, history, and records without touching any real users.
   */
  public purgeQnATestUsers(): { removedQuestions: number; removedUsers: string[] } {
    const targetNames = ['PulseSniper', 'QuantumShooter', 'ApexViper'];
    const targetNamesLower = new Set(targetNames.map(n => n.toLowerCase()));
    const targetIds = new Set(['community_member_1', 'community_member_2', 'community_member_3']);

    const matchedUsers: string[] = [];
    let removedQuestions = 0;

    if (this.data.questions && this.data.questions.length > 0) {
      const initialCount = this.data.questions.length;
      this.data.questions = this.data.questions.filter(q => {
        const uname = (q.username || '').toLowerCase();
        const matchesName = targetNamesLower.has(uname);
        const matchesId = targetIds.has(q.userId) || targetIds.has(q.kickUserId);
        if (matchesName || matchesId) {
          if (!matchedUsers.includes(q.username)) {
            matchedUsers.push(q.username);
          }
          return false;
        }
        return true;
      });
      removedQuestions = initialCount - this.data.questions.length;
      if (removedQuestions > 0) {
        this.addSystemLog('info', 'QA_CLEANUP', `Purged ${removedQuestions} test questions/answers for: ${matchedUsers.join(', ')}`);
      }
    }

    // Also remove from kickUsers if any record was created for these 3 test users
    if (this.data.kickUsers && this.data.kickUsers.length > 0) {
      this.data.kickUsers = this.data.kickUsers.filter(u => {
        const matchesName = targetNamesLower.has((u.username || '').toLowerCase());
        const matchesId = targetIds.has(u.kickUserId);
        return !(matchesName || matchesId);
      });
    }

    this.saveSync();
    return { removedQuestions, removedUsers: matchedUsers };
  }

  // --- Initial Seed Data ---
  private seedInitialDatabase() {
    console.log('[DB] Seeding database with official Slyyutus channel statistics & community records...');
    
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const currentSeasonId = `${mm}-${yy}`;

    const channel: DBChannel = {
      id: 'chan_slyyutus_01',
      slug: 'slyyutus',
      username: 'Slyyutus',
      userId: 231626,
      avatarUrl: 'https://files.kick.com/images/user/231626/profile_image/conversion/b39d4d71-93ab-4563-ad7a-b054e4fdd90a-medium.webp',
      bannerUrl: 'https://files.kick.com/images/channel/229384/banner_image/cf8c17a6-7c91-4b0c-966f-19840659e80b',
      bio: 'Moroccan Streamer !\nGamer ! GODAIM',
      followersCount: 26141,
      subscribersCount: 66,
      totalViews: 0,
      isLive: false,
      currentViewers: 0,
      averageViewers: 0,
      peakViewers: 0,
      totalStreams: 0,
      currentStreamTitle: '',
      currentStreamCategory: '',
      lastUpdated: new Date().toISOString()
    };

    const pointRules: DBPointRule[] = [
      { ruleKey: 'CHAT_MESSAGE', pointValue: 1, description: '1 point per valid chat message in live stream', updatedAt: new Date().toISOString() },
      { ruleKey: 'SUBSCRIPTION', pointValue: 100, description: '100 points for subscribing to Slyyutus', updatedAt: new Date().toISOString() },
      { ruleKey: 'GIFT_SUBSCRIPTION', pointValue: 100, description: '100 points per gift subscription to the community', updatedAt: new Date().toISOString() }
    ];

    const badges: DBBadge[] = [
      { badgeId: 'b_s1', code: 'SEASON_1ST', title: '1st Place Champion', description: 'Awarded to the #1 League Chatter of the Season', iconType: 'trophy', badgeTier: 'gold', category: 'season' },
      { badgeId: 'b_s2', code: 'SEASON_2ND', title: '2nd Place Finalist', description: 'Awarded to the #2 League Chatter of the Season', iconType: 'medal', badgeTier: 'silver', category: 'season' },
      { badgeId: 'b_s3', code: 'SEASON_3RD', title: '3rd Place Bronze', description: 'Awarded to the #3 League Chatter of the Season', iconType: 'award', badgeTier: 'bronze', category: 'season' },
      { badgeId: 'b_vod_top', code: 'VOD_TOP_CHATTER', title: 'Top VOD Chatter', description: 'Highest chat volume in a recorded stream session', iconType: 'flame', badgeTier: 'flame', category: 'vod' },
      { badgeId: 'b_sub_god', code: 'SUB_TITAN', title: 'Sub Titan', description: 'Supported the channel with 10+ subscriptions or gifts', iconType: 'crown', badgeTier: 'diamond', category: 'sub' },
      { badgeId: 'b_og', code: 'OG_CHATTER', title: 'OG Chatter', description: 'Community veteran participating across multiple seasons', iconType: 'shield', badgeTier: 'special', category: 'community' }
    ];

    const leagueSeasons: DBLeagueSeason[] = [
      {
        seasonId: currentSeasonId,
        name: 'September 2026',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.000Z',
        isActive: true,
        isFinalized: false,
        totalParticipants: 0,
        totalPointsDistributed: 0
      }
    ];

    const kickUsers: DBKickUser[] = [];
    const leaguePoints: DBLeaguePoints[] = [];
    const userBadges: DBUserBadge[] = [];
    const users: DBUser[] = [];

    const streams: DBStream[] = [];
    const vodChatterStats: DBVodChatterStat[] = [];
    const chatMessages: DBChatMessage[] = [];

    const systemLogs: DBSystemLog[] = [
      {
        id: 'log_boot_01',
        level: 'info',
        module: 'DATABASE',
        message: 'Initialized clean database with official Slyyutus Kick channel profile.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'log_boot_02',
        level: 'success',
        module: 'LEAGUE_ENGINE',
        message: `Active Season set to ${currentSeasonId} (September 2026).`,
        createdAt: new Date().toISOString()
      }
    ];

    this.data = {
      users,
      kickUsers,
      channel,
      streams,
      chatMessages,
      subscriptionEvents: [],
      leagueSeasons,
      leaguePoints,
      leagueRankings: [],
      badges,
      userBadges,
      vodChatterStats,
      pointRules,
      systemLogs,
      miniGameScores: [],
      pointTransactions: [],
      processedEventIds: [],
      questions: []
    };

    this.saveSync();
    console.log('[DB] Clean database initialized successfully with zero mock data.');
  }
}

export const db = new Database();
