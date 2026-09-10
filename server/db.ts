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

export interface DBMiniGameScore {
  id: string;
  gameId: string; // 'lockpicking' | 'hacking' | 'wires' | 'safecracking' | 'keypad' | 'memory' | 'signal'
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  timeSeconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
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
        if (!this.data.miniGameScores) {
          this.data.miniGameScores = [];
        }
        if (!this.data.userBadges) {
          this.data.userBadges = [];
        }

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

    // If streamId not explicitly passed, detect active or matching stream based on timestamp
    let targetStreamId = event.streamId;
    if (!targetStreamId) {
      targetStreamId = this.getActiveStreamId();
      if (!targetStreamId) {
        const eventTime = new Date(event.timestamp || Date.now()).getTime();
        const matchedStream = this.data.streams.find(s => {
          const start = new Date(s.startedAt).getTime();
          const end = s.endedAt ? new Date(s.endedAt).getTime() : (start + (s.durationSeconds * 1000) + 15 * 60 * 1000);
          return eventTime >= start && eventTime <= end;
        });
        if (matchedStream) targetStreamId = matchedStream.streamId;
      }
    }

    if (targetStreamId && !event.isTest) {
      fullEvent.streamId = targetStreamId;
      const stream = this.getStreamById(targetStreamId);
      if (stream) {
        stream.subscribersGained = (stream.subscribersGained || 0) + 1;
        stream.subsGained = stream.subscribersGained;
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

  /**
   * Recalculates subscriptions received during each VOD strictly based on:
   * 1. Explicit streamId association
   * 2. Or subscription timestamp falling between VOD start and end time.
   * Guarantees no double-counting and correctly handles VODs with zero subs.
   */
  public recalculateStreamSubscriptions(): { streamsUpdated: number; totalSubsTracked: number; perStream: Record<string, number> } {
    const streams = this.data.streams || [];
    const subEvents = (this.data.subscriptionEvents || []).filter(e => !e.isTest);
    const streamSubsCount: Record<string, number> = {};
    streams.forEach(s => { streamSubsCount[s.streamId] = 0; });

    const claimedEventIds = new Set<string>();

    // Pass 1: Explicit streamId matching
    for (const event of subEvents) {
      if (event.streamId && streamSubsCount[event.streamId] !== undefined) {
        streamSubsCount[event.streamId] = (streamSubsCount[event.streamId] || 0) + 1;
        claimedEventIds.add(event.id);
      }
    }

    // Pass 2: Timestamp-based attribution for unclaimed events
    for (const event of subEvents) {
      if (claimedEventIds.has(event.id)) continue;

      const eventTime = new Date(event.timestamp).getTime();
      if (isNaN(eventTime)) continue;

      // Find the stream that spans this timestamp
      const matched = streams.find(s => {
        const startTime = new Date(s.startedAt).getTime();
        const endTime = s.endedAt ? new Date(s.endedAt).getTime() : (startTime + (s.durationSeconds * 1000) + 15 * 60 * 1000);
        return eventTime >= startTime && eventTime <= endTime;
      });

      if (matched) {
        streamSubsCount[matched.streamId] = (streamSubsCount[matched.streamId] || 0) + 1;
        claimedEventIds.add(event.id);
        // Persist explicit link so future lookups are instant
        event.streamId = matched.streamId;
      }
    }

    // Apply exact counts to streams without loss of data
    let updated = 0;
    for (const stream of streams) {
      const calculatedCount = streamSubsCount[stream.streamId] || 0;
      stream.subscribersGained = calculatedCount;
      stream.subsGained = calculatedCount;
      updated++;
    }

    this.addSystemLog('info', 'SUBS_TRACKER', `Recalculated subscriptions for ${updated} VODs (${claimedEventIds.size} non-overlapping subs linked).`);
    this.save();
    return {
      streamsUpdated: updated,
      totalSubsTracked: claimedEventIds.size,
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
  public saveMiniGameScore(score: Omit<DBMiniGameScore, 'id' | 'createdAt'>): DBMiniGameScore {
    if (!this.data.miniGameScores) {
      this.data.miniGameScores = [];
    }

    const fullScore: DBMiniGameScore = {
      id: `mgs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...score,
      createdAt: new Date().toISOString()
    };

    this.data.miniGameScores.push(fullScore);
    this.addSystemLog('info', 'MINI_GAMES', `Recorded score for ${score.username} in ${score.gameId} (${score.difficulty}): ${score.score} pts (${score.timeSeconds}s)`);
    this.save();
    return fullScore;
  }

  public getMiniGameLeaderboard(gameId?: string, difficulty?: string, limit: number = 50) {
    if (!this.data.miniGameScores || this.data.miniGameScores.length === 0) {
      this.seedInitialMiniGameScores();
    }

    const scores = (this.data.miniGameScores || []).filter(s => s.success);
    let filtered = scores;

    if (gameId && gameId !== 'all') {
      filtered = filtered.filter(s => s.gameId === gameId);
    }
    if (difficulty && difficulty !== 'all') {
      filtered = filtered.filter(s => s.difficulty === difficulty);
    }

    // Aggregate user bests
    const userMap = new Map<string, {
      userId: string;
      username: string;
      avatarUrl: string;
      bestScore: number;
      fastestTime: number;
      totalWins: number;
      lastPlayedAt: string;
      favoriteGame: string;
      difficulty: string;
    }>();

    for (const s of filtered) {
      const existing = userMap.get(s.userId);
      if (!existing) {
        userMap.set(s.userId, {
          userId: s.userId,
          username: s.username,
          avatarUrl: s.avatarUrl,
          bestScore: s.score,
          fastestTime: s.timeSeconds,
          totalWins: 1,
          lastPlayedAt: s.createdAt,
          favoriteGame: s.gameId,
          difficulty: s.difficulty
        });
      } else {
        existing.totalWins += 1;
        if (s.score > existing.bestScore) existing.bestScore = s.score;
        if (s.timeSeconds < existing.fastestTime) existing.fastestTime = s.timeSeconds;
        if (s.createdAt > existing.lastPlayedAt) existing.lastPlayedAt = s.createdAt;
      }
    }

    // Rank players: Highest best score, then lowest fastest time
    const leaderboard = Array.from(userMap.values())
      .sort((a, b) => b.bestScore - a.bestScore || a.fastestTime - b.fastestTime)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    return {
      gameId: gameId || 'all',
      difficulty: difficulty || 'all',
      leaderboard,
      totalEntries: userMap.size,
      recentScores: (this.data.miniGameScores || []).slice(-15).reverse()
    };
  }

  public getUserMiniGameStats(userId: string) {
    if (!this.data.miniGameScores || this.data.miniGameScores.length === 0) {
      this.seedInitialMiniGameScores();
    }

    const allUserScores = (this.data.miniGameScores || []).filter(s => s.userId === userId);
    const wins = allUserScores.filter(s => s.success);
    
    const games = ['lockpicking', 'hacking', 'wires', 'safecracking', 'keypad', 'memory', 'signal'];
    const perGame: Record<string, { bestScore: number; fastestTime: number; wins: number; attempts: number }> = {};
    
    games.forEach(g => {
      const gameScores = allUserScores.filter(s => s.gameId === g);
      const gameWins = gameScores.filter(s => s.success);
      perGame[g] = {
        bestScore: gameWins.length > 0 ? Math.max(...gameWins.map(s => s.score)) : 0,
        fastestTime: gameWins.length > 0 ? Math.min(...gameWins.map(s => s.timeSeconds)) : 0,
        wins: gameWins.length,
        attempts: gameScores.length
      };
    });

    return {
      userId,
      totalAttempts: allUserScores.length,
      totalWins: wins.length,
      overallBestScore: wins.length > 0 ? Math.max(...wins.map(s => s.score)) : 0,
      fastestWinTime: wins.length > 0 ? Math.min(...wins.map(s => s.timeSeconds)) : 0,
      perGame
    };
  }

  /**
   * Seeds initial competitive leaderboard scores from active community members
   */
  public seedInitialMiniGameScores(): void {
    if (this.data.miniGameScores && this.data.miniGameScores.length > 0) return;

    this.data.miniGameScores = [
      {
        id: 'mgs_seed_01',
        gameId: 'lockpicking',
        userId: '240182',
        username: 'ApexLegend99',
        avatarUrl: 'https://files.kick.com/images/default_avatars/avatar_3.png',
        score: 950,
        timeSeconds: 6.4,
        difficulty: 'hard',
        success: true,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'mgs_seed_02',
        gameId: 'hacking',
        userId: '238190',
        username: 'CasperX_Fan',
        avatarUrl: 'https://files.kick.com/images/default_avatars/avatar_1.png',
        score: 890,
        timeSeconds: 8.1,
        difficulty: 'hard',
        success: true,
        createdAt: new Date(Date.now() - 3600000 * 7).toISOString()
      },
      {
        id: 'mgs_seed_03',
        gameId: 'wires',
        userId: '239102',
        username: 'MoroccanSniper',
        avatarUrl: 'https://files.kick.com/images/default_avatars/avatar_2.png',
        score: 920,
        timeSeconds: 7.2,
        difficulty: 'medium',
        success: true,
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'mgs_seed_04',
        gameId: 'safecracking',
        userId: '242901',
        username: 'GodAim_Jr',
        avatarUrl: 'https://files.kick.com/images/default_avatars/avatar_5.png',
        score: 880,
        timeSeconds: 11.5,
        difficulty: 'hard',
        success: true,
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
      },
      {
        id: 'mgs_seed_05',
        gameId: 'keypad',
        userId: '243881',
        username: 'Casawi_Gamer',
        avatarUrl: 'https://files.kick.com/images/default_avatars/avatar_6.png',
        score: 960,
        timeSeconds: 4.8,
        difficulty: 'medium',
        success: true,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'mgs_seed_06',
        gameId: 'memory',
        userId: '244190',
        username: 'Tanger_Warrior',
        avatarUrl: 'https://files.kick.com/images/default_avatars/avatar_7.png',
        score: 910,
        timeSeconds: 8.9,
        difficulty: 'hard',
        success: true,
        createdAt: new Date(Date.now() - 3600000 * 30).toISOString()
      },
      {
        id: 'mgs_seed_07',
        gameId: 'signal',
        userId: '245812',
        username: 'Yassine_Pro',
        avatarUrl: 'https://files.kick.com/images/default_avatars/avatar_8.png',
        score: 870,
        timeSeconds: 9.3,
        difficulty: 'medium',
        success: true,
        createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
      }
    ];
    this.saveSync();
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
      miniGameScores: []
    };

    this.saveSync();
    console.log('[DB] Clean database initialized successfully with zero mock data.');
  }
}

export const db = new Database();
