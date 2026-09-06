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
  kickUserId: string;
  username: string;
  avatarUrl: string;
  type: 'SUBSCRIPTION' | 'GIFT_SUBSCRIPTION';
  streamId?: string;
  gifterUserId?: string;
  gifterUsername?: string;
  pointsAwarded: number;
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

export interface DBSystemLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
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

        // Initialize subscription events collection if absent
        if (!this.data.subscriptionEvents) {
          this.data.subscriptionEvents = [];
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
      username.toLowerCase().startsWith('test') || 
      username.toLowerCase().includes('demo_user') || 
      username.toLowerCase().includes('fake_user') || 
      kickUserId.startsWith('k_test') || 
      kickUserId.startsWith('test_')
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

  public searchKickUsers(query: string, limit: number = 20, offset: number = 0): { users: DBKickUser[]; total: number } {
    const q = query.trim().toLowerCase();
    const realUsers = this.data.kickUsers.filter(u => !u.isTest);
    const filtered = q
      ? realUsers.filter(u => u.username.toLowerCase().includes(q) || u.kickUserId.includes(q))
      : realUsers;
    
    // Sort by activity (messages + subs * 100)
    filtered.sort((a, b) => (b.totalMessages + b.totalSubs * 100) - (a.totalMessages + a.totalSubs * 100));
    const total = filtered.length;
    const users = filtered.slice(offset, offset + limit);
    return { users, total };
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

  public addPoints(kickUserId: string, username: string, avatarUrl: string, type: 'CHAT_MESSAGE' | 'SUBSCRIPTION' | 'GIFT_SUBSCRIPTION', customPoints?: number, isTest: boolean = false): { pointsAwarded: number; totalPoints: number } {
    const isTestFlag = isTest || username.toLowerCase().startsWith('test') || kickUserId.startsWith('k_test') || kickUserId.startsWith('test_');
    const user = this.ensureKickUser(kickUserId, username, avatarUrl, isTestFlag);
    const activeSeason = this.getActiveSeason();
    const now = new Date().toISOString();

    let pointsAwarded = customPoints !== undefined ? customPoints : this.getPointRule(type);

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

    user.lastActiveAt = now;
    if (!isTestFlag) {
      activeSeason.totalPointsDistributed += pointsAwarded;
    }
    this.save();

    return { pointsAwarded, totalPoints: pointRecord.points };
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
    return this.data.userBadges
      .filter(ub => ub.kickUserId === kickUserId)
      .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt));
  }

  public awardBadge(kickUserId: string, badgeCode: string, metadata: { seasonId?: string; seasonName?: string; streamId?: string; streamTitle?: string; rankPosition?: number }): DBUserBadge | null {
    const badge = this.data.badges.find(b => b.code === badgeCode);
    if (!badge) return null;

    // Check if duplicate badge for same season/stream already exists
    const existing = this.data.userBadges.find(ub => 
      ub.kickUserId === kickUserId &&
      ub.badgeId === badge.badgeId &&
      (metadata.seasonId ? ub.seasonId === metadata.seasonId : true) &&
      (metadata.streamId ? ub.streamId === metadata.streamId : true)
    );

    if (existing) return existing;

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
    this.addSystemLog('success', 'BADGE_ENGINE', `Awarded badge '${badge.title}' to user ${kickUserId}`);
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
      this.data.streams[idx] = { ...this.data.streams[idx], ...stream };
    } else {
      this.data.streams.push(stream);
    }
    this.save();
  }

  public upsertStreams(streams: DBStream[]): void {
    for (const s of streams) {
      const idx = this.data.streams.findIndex(item => item.streamId === s.streamId);
      if (idx >= 0) {
        this.data.streams[idx] = { ...this.data.streams[idx], ...s };
      } else {
        this.data.streams.push(s);
      }
    }
    this.save();
  }

  // --- Webhook Deduplication & Idempotency ---
  private processedWebhookEventIds: Set<string> = new Set();

  public isWebhookProcessed(eventId: string): boolean {
    if (!eventId) return false;
    return this.processedWebhookEventIds.has(eventId);
  }

  public markWebhookProcessed(eventId: string): void {
    if (!eventId) return;
    this.processedWebhookEventIds.add(eventId);
    if (this.processedWebhookEventIds.size > 5000) {
      const first = this.processedWebhookEventIds.values().next().value;
      if (first) this.processedWebhookEventIds.delete(first);
    }
  }

  // --- Subscriptions ---
  public addSubscriptionEvent(event: Omit<DBSubscriptionEvent, 'id'>): DBSubscriptionEvent {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullEvent: DBSubscriptionEvent = { ...event, id };

    if (!this.data.subscriptionEvents) {
      this.data.subscriptionEvents = [];
    }
    this.data.subscriptionEvents.push(fullEvent);

    if (event.streamId && !event.isTest) {
      const stream = this.getStreamById(event.streamId);
      if (stream) {
        stream.subscribersGained = (stream.subscribersGained || 0) + 1;
      }
    }

    // Award 100 league points (per official rules)
    this.addPoints(event.kickUserId, event.username, event.avatarUrl, event.type, 100, event.isTest);

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

  // --- Chat Messages ---
  public addChatMessage(msg: Omit<DBChatMessage, 'messageId' | 'pointsAwarded'> & { messageId?: string }): DBChatMessage {
    const pointValue = this.getPointRule('CHAT_MESSAGE');
    const isTest = Boolean(msg.isTest || (msg.username && msg.username.toLowerCase().startsWith('test')));

    // Deduplication check 1: Exact messageId
    if (msg.messageId) {
      const existing = this.data.chatMessages.find(m => m.messageId === msg.messageId);
      if (existing) {
        return existing;
      }
    }

    // Deduplication check 2: Same user, exact content, within 5 seconds timestamp
    const msgTime = new Date(msg.timestamp).getTime();
    if (!isNaN(msgTime)) {
      const existingFuzzy = this.data.chatMessages.find(m => 
        m.kickUserId === msg.kickUserId && 
        m.content === msg.content && 
        Math.abs(new Date(m.timestamp).getTime() - msgTime) < 5000
      );
      if (existingFuzzy) {
        return existingFuzzy;
      }
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
      const formatted = new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return formatted === dateStr || m.timestamp.startsWith(dateStr);
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
      systemLogs
    };

    this.saveSync();
    console.log('[DB] Clean database initialized successfully with zero mock data.');
  }
}

export const db = new Database();
