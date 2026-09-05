import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db.js';
import { kickService } from './kickService.js';
import { LeagueEngine } from './leagueEngine.js';
import { trackerService } from './trackerService.js';
import { AuthRequest, generateToken, requireAdmin, requireAuth } from './auth.js';

export const apiRouter = express.Router();

// --- Channel Endpoints ---
apiRouter.get('/channel/stats', (req: Request, res: Response) => {
  const channel = db.getChannel();
  res.json({
    status: 'ok',
    channel
  });
});

apiRouter.get('/channel/history', (req: Request, res: Response) => {
  // Return viewer trend and stream activity data calculated directly from actual stored streams
  const streams = db.getStreams(10, 0).streams;
  const history = streams.map(s => ({
    date: new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    viewers: s.averageViewers || 0,
    peak: s.peakViewers || 0,
    chatVolume: s.totalChatMessages || 0,
    subs: s.subscribersGained || 0
  })).reverse();
  res.json({ history });
});

// --- League Endpoints ---
apiRouter.get('/league/current', (req: Request, res: Response) => {
  const activeSeason = db.getActiveSeason();
  const q = req.query.q as string | undefined;
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

  const data = db.getLeagueRankings(activeSeason.seasonId, q, limit, offset);

  res.json({
    season: activeSeason,
    rankings: data.rankings,
    total: data.total,
    topThree: data.topThree,
    limit,
    offset
  });
});

apiRouter.get('/league/seasons', (req: Request, res: Response) => {
  const seasons = db.getSeasons();
  // Attach top 3 winners for each finalized season
  const enriched = seasons.map(s => {
    const { topThree } = db.getLeagueRankings(s.seasonId, undefined, 3, 0);
    return {
      ...s,
      topWinners: {
        first: topThree[0] ? { username: topThree[0].username, kickUserId: topThree[0].kickUserId, avatarUrl: topThree[0].avatarUrl, points: topThree[0].points } : undefined,
        second: topThree[1] ? { username: topThree[1].username, kickUserId: topThree[1].kickUserId, avatarUrl: topThree[1].avatarUrl, points: topThree[1].points } : undefined,
        third: topThree[2] ? { username: topThree[2].username, kickUserId: topThree[2].kickUserId, avatarUrl: topThree[2].avatarUrl, points: topThree[2].points } : undefined
      }
    };
  });
  res.json({ seasons: enriched });
});

apiRouter.get('/league/season/:seasonId', (req: Request, res: Response) => {
  const seasonId = req.params.seasonId;
  const season = db.getSeason(seasonId);
  if (!season) {
    return res.status(404).json({ error: `Season ${seasonId} not found` });
  }

  const q = req.query.q as string | undefined;
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

  const data = db.getLeagueRankings(seasonId, q, limit, offset);

  res.json({
    season,
    rankings: data.rankings,
    total: data.total,
    topThree: data.topThree,
    limit,
    offset
  });
});

// --- Users & Profiles ---
apiRouter.get('/users/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

  const result = db.searchKickUsers(q, limit, offset);
  res.json(result);
});

apiRouter.get('/user/me/stats', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login with your Kick account.' });
  }

  const kickUserId = req.user.kickUserId;
  const user = db.getKickUserById(kickUserId) || db.getKickUserByUsername(req.user.username);

  if (!user) {
    return res.status(404).json({ error: 'User profile not found in database.' });
  }

  const activeSeason = db.getActiveSeason();
  const pointRec = db.getSeasonPointsRecord(activeSeason.seasonId, user.kickUserId);
  const { rankings } = db.getLeagueRankings(activeSeason.seasonId, undefined, 1000, 0);
  
  const userRankIndex = rankings.findIndex(r => r.kickUserId === user.kickUserId);
  const rank = userRankIndex !== -1 ? userRankIndex + 1 : (pointRec ? rankings.length + 1 : null);
  const points = pointRec?.points || 0;

  let pointsToNextRank: number | null = null;
  let nextRank: number | null = null;
  if (userRankIndex > 0) {
    const higherUser = rankings[userRankIndex - 1];
    pointsToNextRank = Math.max(1, (higherUser.points - points) + 1);
    nextRank = userRankIndex;
  } else if (userRankIndex === -1 && rankings.length > 0) {
    const lastUser = rankings[rankings.length - 1];
    pointsToNextRank = Math.max(1, (lastUser.points - points) + 1);
    nextRank = rankings.length;
  }

  const rawBadges = db.getUserBadges(user.kickUserId);
  const allBadgesDef = db.getBadges();
  const badges = rawBadges.map((ub, idx) => {
    const badgeDef = allBadgesDef.find(b => b.badgeId === ub.badgeId) || {
      badgeId: ub.badgeId,
      code: 'SPECIAL',
      title: 'Honorary Badge',
      description: 'Awarded to community member',
      iconType: 'shield',
      badgeTier: 'gold' as const,
      category: 'community' as const
    };
    return {
      ...ub,
      awardId: (ub as any).awardId || ub.id || `ub_${ub.badgeId}_${idx}`,
      badge: badgeDef
    };
  });

  const recentChats = db.getUserChatMessages(user.kickUserId, 10, 0).messages || [];

  const normalizedUser = {
    ...user,
    totalChatMessages: (user as any).totalChatMessages || user.totalMessages || 0,
    totalSubscriptions: (user as any).totalSubscriptions || user.totalSubs || 0,
    totalGifts: user.totalGifts || 0,
    totalMessages: user.totalMessages || (user as any).totalChatMessages || 0,
    totalSubs: user.totalSubs || (user as any).totalSubscriptions || 0,
  };

  res.json({
    user: normalizedUser,
    rank,
    points,
    messagesCount: pointRec?.messagesCount || user.totalMessages || 0,
    subsCount: pointRec?.subsCount || user.totalSubs || 0,
    giftsCount: pointRec?.giftsCount || user.totalGifts || 0,
    pointsToNextRank,
    nextRank,
    seasonName: activeSeason.name,
    seasonId: activeSeason.seasonId,
    badges,
    recentChats
  });
});

apiRouter.get('/user/:username', (req: Request, res: Response) => {
  const username = req.params.username;
  let user = db.getKickUserByUsername(username);
  if (!user) {
    // Check if ID was passed instead
    user = db.getKickUserById(username);
  }

  if (!user) {
    return res.status(404).json({ error: `User '${username}' not found in Slyyutus database.` });
  }

  const activeSeason = db.getActiveSeason();
  const currentSeasonPointRecord = db.getSeasonPointsRecord(activeSeason.seasonId, user.kickUserId);

  // Compute current rank
  let currentRank: number | null = null;
  if (currentSeasonPointRecord) {
    const { rankings } = db.getLeagueRankings(activeSeason.seasonId, undefined, 1000, 0);
    const found = rankings.find(r => r.kickUserId === user!.kickUserId);
    if (found) currentRank = found.rank;
  }

  // Get historical season rankings
  const seasons = db.getSeasons();
  const historicalRankings = seasons.map(s => {
    const pointRec = db.getSeasonPointsRecord(s.seasonId, user!.kickUserId);
    if (!pointRec) return null;
    const { rankings } = db.getLeagueRankings(s.seasonId, undefined, 1000, 0);
    const rFound = rankings.find(r => r.kickUserId === user!.kickUserId);
    return {
      seasonId: s.seasonId,
      seasonName: s.name,
      rank: rFound ? rFound.rank : 999,
      points: pointRec.points || 0,
      messagesCount: pointRec.messagesCount || 0,
      subsCount: pointRec.subsCount || 0,
      giftsCount: pointRec.giftsCount || 0,
      isFinalized: s.isFinalized
    };
  }).filter(Boolean);

  // Badges
  const rawBadges = db.getUserBadges(user.kickUserId);
  const allBadgesDef = db.getBadges();
  const earnedBadges = rawBadges.map((ub, idx) => {
    const badgeDef = allBadgesDef.find(b => b.badgeId === ub.badgeId) || {
      badgeId: ub.badgeId,
      code: 'SPECIAL',
      title: 'Honorary Badge',
      description: 'Awarded to community member',
      iconType: 'shield',
      badgeTier: 'gold',
      category: 'community'
    };
    return {
      ...ub,
      awardId: (ub as any).awardId || ub.id || `award_${ub.badgeId}_${idx}`,
      badge: badgeDef
    };
  });

  // VOD participation
  const allStreams = db.getStreams(100, 0).streams || [];
  const vodParticipation: any[] = [];
  allStreams.forEach(stream => {
    const ranks = db.getVodChatterRankings(stream.streamId) || [];
    const chatterStat = ranks.find(r => r.kickUserId === user!.kickUserId);
    if (chatterStat && chatterStat.messageCount > 0) {
      vodParticipation.push({
        streamId: stream.streamId,
        streamTitle: stream.title,
        title: stream.title,
        startedAt: stream.startedAt,
        date: stream.startedAt,
        messagesCount: chatterStat.messageCount,
        rank: chatterStat.rankInVod,
        rankInVod: chatterStat.rankInVod,
        badgeAwarded: chatterStat.badgeAwarded
      });
    }
  });

  // Recent chat messages
  const recentMessages = db.getUserChatMessages(user.kickUserId, 15, 0).messages || [];

  const normalizedUser = {
    ...user,
    totalChatMessages: (user as any).totalChatMessages || user.totalMessages || 0,
    totalSubscriptions: (user as any).totalSubscriptions || user.totalSubs || 0,
    totalGifts: user.totalGifts || 0,
    totalMessages: user.totalMessages || (user as any).totalChatMessages || 0,
    totalSubs: user.totalSubs || (user as any).totalSubscriptions || 0,
  };

  res.json({
    user: normalizedUser,
    currentSeasonRank: currentRank,
    currentSeasonPoints: currentSeasonPointRecord?.points || 0,
    currentSeasonMessages: currentSeasonPointRecord?.messagesCount || 0,
    currentSeasonSubs: currentSeasonPointRecord?.subsCount || 0,
    currentSeasonGifts: currentSeasonPointRecord?.giftsCount || 0,
    seasonHistory: historicalRankings || [],
    historicalRankings: historicalRankings || [],
    badges: earnedBadges || [],
    earnedBadges: earnedBadges || [],
    vodParticipation: vodParticipation || [],
    recentMessages: recentMessages || []
  });
});

apiRouter.get('/user/:username/messages', (req: Request, res: Response) => {
  const username = req.params.username;
  const user = db.getKickUserByUsername(username) || db.getKickUserById(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

  const data = db.getUserChatMessages(user.kickUserId, limit, offset);
  res.json(data);
});

// --- Chat Analytics ---
apiRouter.get('/chat/analytics', (req: Request, res: Response) => {
  const allResult = db.getChatMessages(100, 0);
  const recentMessages = allResult.messages || [];
  const totalMessages = allResult.total || recentMessages.length;

  const userCounts: Record<string, { count: number; username: string; avatarUrl: string }> = {};
  recentMessages.forEach(m => {
    if (!userCounts[m.kickUserId]) {
      userCounts[m.kickUserId] = {
        count: 0,
        username: m.username,
        avatarUrl: m.avatarUrl
      };
    }
    userCounts[m.kickUserId].count++;
  });

  const activeChatters = Object.keys(userCounts).length;
  const averageMessagesPerUser = activeChatters > 0 ? Math.round(totalMessages / activeChatters) : 0;

  const topChatters = Object.entries(userCounts)
    .map(([kickUserId, data]) => ({
      kickUserId,
      username: data.username,
      avatarUrl: data.avatarUrl,
      messageCount: data.count
    }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 10);

  res.json({
    totalMessages,
    activeChatters,
    averageMessagesPerUser,
    topChatters,
    recentMessages
  });
});

// --- VODs & Streams ---
apiRouter.get('/vods', (req: Request, res: Response) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

  const { streams, total } = db.getStreams(limit, offset);

  // Attach top 3 chatters for each stream
  const enriched = streams.map(s => {
    const ranks = db.getVodChatterRankings(s.streamId);
    const topChatters = ranks.slice(0, 3).map(r => {
      const u = db.getKickUserById(r.kickUserId);
      return {
        rank: r.rankInVod,
        kickUserId: r.kickUserId,
        username: u?.username || 'Chatter',
        avatarUrl: u?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.kickUserId}`,
        messageCount: r.messageCount
      };
    });
    return {
      ...s,
      topChatters
    };
  });

  res.json({ streams: enriched, total, limit, offset });
});

apiRouter.get('/vod/:streamId', (req: Request, res: Response) => {
  const streamId = req.params.streamId;
  const stream = db.getStreamById(streamId);
  if (!stream) {
    return res.status(404).json({ error: `Stream/VOD ${streamId} not found` });
  }

  const ranks = db.getVodChatterRankings(streamId);
  const fullRankings = ranks.map(r => {
    const u = db.getKickUserById(r.kickUserId);
    return {
      rank: r.rankInVod,
      kickUserId: r.kickUserId,
      username: u?.username || 'Chatter',
      avatarUrl: u?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.kickUserId}`,
      messageCount: r.messageCount,
      badgeAwarded: r.badgeAwarded
    };
  });

  const chatData = db.getStreamChatMessages(streamId, 300, 0);

  res.json({
    stream,
    chatterRankings: fullRankings,
    rankings: fullRankings,
    totalChatters: fullRankings.length,
    chatMessages: chatData.messages,
    totalMessages: chatData.total
  });
});

apiRouter.get('/vod/:streamId/chat', (req: Request, res: Response) => {
  const streamId = req.params.streamId;
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 100));
  const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

  const stream = db.getStreamById(streamId);
  if (!stream) {
    return res.status(404).json({ error: `Stream/VOD ${streamId} not found` });
  }

  const { messages, total } = db.getStreamChatMessages(streamId, limit, offset);
  res.json({ messages, total, streamId });
});

// --- Authentication & Kick OAuth ---
// In-memory PKCE store so verifier is never lost across cross-domain redirects even if cookies are dropped
const oauthStateStore = new Map<string, { codeVerifier: string; createdAt: number }>();

export function handleKickLogin(req: Request, res: Response) {
  if (!kickService.isConfigured()) {
    console.error('[Kick OAuth] Credentials not configured in environment.');
    return res.redirect('/#login?error=oauth_not_configured');
  }

  const state = crypto.randomBytes(24).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  
  // Clean up states older than 15 minutes
  const now = Date.now();
  for (const [k, v] of oauthStateStore.entries()) {
    if (now - v.createdAt > 15 * 60 * 1000) {
      oauthStateStore.delete(k);
    }
  }
  oauthStateStore.set(state, { codeVerifier, createdAt: now });

  const host = req.headers.host || '';
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || host.includes('127.0.0.1') || host.includes('localhost');
  const isSecure = !isLocal && (req.secure || req.headers['x-forwarded-proto'] === 'https');

  // Set state and PKCE verifier in cookies scoped to root path
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('oauth_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000
  });

  const authUrl = kickService.getAuthorizationUrl(state, codeChallenge);

  if (req.query.format === 'json') {
    return res.json({ authUrl, isConfigured: true });
  }

  return res.redirect(authUrl);
}

export async function handleKickOAuthCallback(req: Request, res: Response) {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const errorParam = req.query.error as string;
  const errorDescription = req.query.error_description as string;
  
  const storedMemory = state ? oauthStateStore.get(state) : undefined;
  if (state) {
    oauthStateStore.delete(state);
  }
  const codeVerifier = req.cookies?.oauth_code_verifier || storedMemory?.codeVerifier;

  // Clear state and verifier cookies
  res.clearCookie('oauth_state', { path: '/' });
  res.clearCookie('oauth_code_verifier', { path: '/' });

  if (errorParam) {
    console.error('[Kick OAuth] Kick returned error param:', errorParam, errorDescription);
    const mappedError = errorParam === 'access_denied' ? 'access_denied' : (errorDescription || errorParam);
    return res.redirect(`/#login?error=${encodeURIComponent(String(mappedError))}`);
  }

  if (!code) {
    console.error('[Kick OAuth] Login error: missing authorization code.');
    return res.redirect('/#login?error=missing_code');
  }

  console.log('[Kick OAuth] Exchanging authorization code with PKCE verifier...');
  const tokenData = await kickService.exchangeCodeForToken(code, codeVerifier);
  if (!tokenData || !tokenData.access_token) {
    console.error('[Kick OAuth] Token exchange failed with Kick OAuth servers.');
    return res.redirect('/#login?error=token_exchange_failed');
  }

  console.log('[Kick OAuth] Fetching user profile from Kick API /public/v1/users...');
  const profile = await kickService.fetchKickUserProfile(tokenData.access_token);
  if (!profile || !profile.id) {
    console.error('[Kick OAuth] Failed to retrieve authenticated Kick user profile.');
    return res.redirect('/#login?error=kick_profile_failed');
  }

  const kickUserId = String(profile.id);
  const username = String(profile.username);
  const avatarUrl = profile.profile_pic || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

  // Log safe confirmation
  console.log('==============================');
  console.log('KICK USER AUTHENTICATED');
  console.log(`username: ${username}`);
  console.log(`userId: ${kickUserId}`);
  console.log('==============================');

  // Record user in real database
  const kickUser = db.ensureKickUser(kickUserId, username, avatarUrl);

  // Check admin status for M4ND4R_x or configured admin
  const isAdmin = db.isUserAdmin(kickUserId, username);
  const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';

  const token = generateToken({
    kickUserId: kickUser.kickUserId,
    username: kickUser.username,
    avatarUrl: kickUser.avatarUrl,
    role
  });

  const host = req.headers.host || '';
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || host.includes('127.0.0.1') || host.includes('localhost');
  const isSecure = !isLocal && (req.secure || req.headers['x-forwarded-proto'] === 'https');

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  db.addSystemLog('success', 'KICK_OAUTH', `User ${username} (Kick ID: ${kickUserId}) authenticated successfully. Role: ${role}`);
  
  // Clean redirect to /my-stats with synchronized token parameter for instant client-side detection
  return res.redirect(`/my-stats?token=${encodeURIComponent(token)}&auth_success=1`);
}

apiRouter.get(['/auth/kick/login', '/auth/kick'], handleKickLogin);
apiRouter.get('/auth/kick/callback', handleKickOAuthCallback);

// Demo login - strictly disabled to enforce real Kick OAuth authentication
apiRouter.post('/auth/demo-login', (req: Request, res: Response) => {
  return res.status(403).json({ 
    error: 'Demo login is disabled. Real Kick OAuth authentication via id.kick.com is required.' 
  });
});

apiRouter.get('/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.json({ isAuthenticated: false, user: null, isAdmin: false });
  }

  const user = db.getKickUserById(req.user.kickUserId) || db.getKickUserByUsername(req.user.username);
  const isAdmin = db.isUserAdmin(req.user.kickUserId, req.user.username);

  res.json({
    isAuthenticated: true,
    user: {
      kickUserId: user?.kickUserId || req.user.kickUserId,
      username: user?.username || req.user.username,
      avatarUrl: user?.avatarUrl || req.user.avatarUrl,
      role: isAdmin ? 'admin' : 'user'
    },
    isAdmin
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ status: 'ok', message: 'Logged out successfully' });
});

// --- Chat Analytics Endpoint ---
apiRouter.get('/chat/analytics', (req: Request, res: Response) => {
  const allMessages = db.getRawData().chatMessages || [];
  const totalMessages = allMessages.length;

  const uniqueChatterIds = new Set(allMessages.map(m => m.kickUserId));
  const activeChatters = uniqueChatterIds.size;

  const chatterCounts: Record<string, { kickUserId: string; username: string; avatarUrl: string; messageCount: number }> = {};
  allMessages.forEach(m => {
    if (!chatterCounts[m.kickUserId]) {
      chatterCounts[m.kickUserId] = {
        kickUserId: m.kickUserId,
        username: m.username,
        avatarUrl: m.avatarUrl,
        messageCount: 0
      };
    }
    chatterCounts[m.kickUserId].messageCount += 1;
  });

  const topChatters = Object.values(chatterCounts)
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 10);

  const recentMessages = [...allMessages]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  res.json({
    totalMessages,
    activeChatters,
    averageMessagesPerUser: activeChatters > 0 ? Math.round(totalMessages / activeChatters) : 0,
    topChatters,
    recentMessages
  });
});

// --- Admin Endpoints ---
apiRouter.get('/admin/point-rules', requireAdmin, (req: AuthRequest, res: Response) => {
  const rules = db.getPointRules();
  res.json({ rules });
});

apiRouter.post('/admin/point-rules', requireAdmin, (req: AuthRequest, res: Response) => {
  const { ruleKey, pointValue } = req.body;
  if (!ruleKey || typeof pointValue !== 'number') {
    return res.status(400).json({ error: 'ruleKey and numeric pointValue required' });
  }

  db.updatePointRule(ruleKey, pointValue);
  res.json({ status: 'ok', rules: db.getPointRules() });
});

apiRouter.post('/admin/finalize-season', requireAdmin, (req: AuthRequest, res: Response) => {
  const { seasonId } = req.body;
  if (!seasonId) {
    return res.status(400).json({ error: 'seasonId required' });
  }

  const success = db.finalizeSeason(seasonId);
  if (!success) {
    return res.status(400).json({ error: `Could not finalize season ${seasonId}. Already finalized or invalid.` });
  }

  res.json({ status: 'ok', message: `Season ${seasonId} successfully finalized and badges awarded.` });
});

apiRouter.post('/admin/award-badge', requireAdmin, (req: AuthRequest, res: Response) => {
  const { kickUserId, badgeCode, seasonId, streamId, rankPosition } = req.body;
  if (!kickUserId || !badgeCode) {
    return res.status(400).json({ error: 'kickUserId and badgeCode required' });
  }

  const award = db.awardBadge(kickUserId, badgeCode, { seasonId, streamId, rankPosition });
  res.json({ status: 'ok', award });
});

apiRouter.get('/admin/logs', requireAdmin, (req: AuthRequest, res: Response) => {
  const logs = db.getSystemLogs(100);
  res.json({ logs });
});

apiRouter.post('/admin/trigger-sync', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { isLive, title, category, followersCount, subscribersCount, currentViewers, averageViewers, peakViewers } = req.body || {};
  
  if (isLive !== undefined || title !== undefined || followersCount !== undefined || subscribersCount !== undefined) {
    db.updateChannel({
      ...(isLive !== undefined ? { isLive: Boolean(isLive) } : {}),
      ...(title !== undefined ? { currentStreamTitle: title } : {}),
      ...(category !== undefined ? { currentStreamCategory: category } : {}),
      ...(followersCount !== undefined ? { followersCount: Number(followersCount) } : {}),
      ...(subscribersCount !== undefined ? { subscribersCount: Number(subscribersCount) } : {}),
      ...(currentViewers !== undefined ? { currentViewers: Number(currentViewers) } : {}),
      ...(averageViewers !== undefined ? { averageViewers: Number(averageViewers) } : {}),
      ...(peakViewers !== undefined ? { peakViewers: Number(peakViewers) } : {})
    });
    db.addSystemLog('info', 'CHANNEL_UPDATE', `Admin updated channel stats directly`);
    return res.json({ status: 'ok', success: true, channel: db.getChannel() });
  }

  const success = await kickService.syncChannelStats();
  res.json({ status: 'ok', success, channel: db.getChannel() });
});

apiRouter.post('/admin/update-channel', requireAdmin, (req: AuthRequest, res: Response) => {
  const { followersCount, subscribersCount, currentViewers, averageViewers, peakViewers, isLive, currentStreamTitle, currentStreamCategory, bio } = req.body;
  
  db.updateChannel({
    ...(followersCount !== undefined ? { followersCount: Number(followersCount) } : {}),
    ...(subscribersCount !== undefined ? { subscribersCount: Number(subscribersCount) } : {}),
    ...(currentViewers !== undefined ? { currentViewers: Number(currentViewers) } : {}),
    ...(averageViewers !== undefined ? { averageViewers: Number(averageViewers) } : {}),
    ...(peakViewers !== undefined ? { peakViewers: Number(peakViewers) } : {}),
    ...(isLive !== undefined ? { isLive: Boolean(isLive) } : {}),
    ...(currentStreamTitle !== undefined ? { currentStreamTitle } : {}),
    ...(currentStreamCategory !== undefined ? { currentStreamCategory } : {}),
    ...(bio !== undefined ? { bio } : {})
  });

  db.addSystemLog('success', 'CHANNEL_CONFIG', `Updated channel metrics`);
  res.json({ status: 'ok', channel: db.getChannel() });
});

apiRouter.post('/admin/adjust-points', requireAdmin, (req: AuthRequest, res: Response) => {
  const { kickUserId, pointsAdjustment, reason } = req.body;
  const activeSeason = db.getActiveSeason();
  const pointRec = db.getSeasonPointsRecord(activeSeason.seasonId, kickUserId);
  if (!pointRec) {
    return res.status(404).json({ error: 'User point record not found in active season.' });
  }

  pointRec.points += pointsAdjustment;
  db.addSystemLog('warn', 'ADMIN_ADJUST', `Admin adjusted points for ${kickUserId} by ${pointsAdjustment} (${reason || 'Manual Correction'})`);
  db.save();

  res.json({ status: 'ok', currentPoints: pointRec.points });
});

apiRouter.post('/admin/test-event', requireAdmin, (req: AuthRequest, res: Response) => {
  const { type, username, kickUserId, messageContent } = req.body;
  const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'Chatter'}`;
  const uid = kickUserId || `k_${Date.now()}`;
  const uname = username || 'TestChatter';

  if (type === 'CHAT') {
    const targetStreamId = (req.body.streamId as string) || db.getActiveStreamId() || 'vod_live_active';
    db.addChatMessage({
      kickUserId: uid,
      username: uname,
      avatarUrl: avatar,
      streamId: targetStreamId,
      streamTitle: db.getStreamById(targetStreamId)?.title || db.getChannel().currentStreamTitle || 'Kick Broadcast',
      content: messageContent || 'Live message test from Admin Panel!',
      timestamp: new Date().toISOString()
    });
  } else if (type === 'SUB') {
    db.addPoints(uid, uname, avatar, 'SUBSCRIPTION');
  } else if (type === 'GIFT') {
    db.addPoints(uid, uname, avatar, 'GIFT_SUBSCRIPTION');
  }

  res.json({ status: 'ok', message: `Dispatched test ${type} event for ${uname}` });
});

// --- Kick Webhook Receiver ---
apiRouter.post('/webhooks/kick', (req: Request, res: Response) => {
  const event = req.body || {};
  const eventType = (req.headers['kick-event-type'] as string) || event.type || event.event || 'unknown';

  db.addSystemLog('info', 'WEBHOOK', `Received Kick webhook event: ${eventType}`);

  try {
    const data = event.data || event;

    // Handle chat message event
    if (eventType.includes('chat.message') || eventType === 'ChatMessage') {
      const sender = data.sender || data.chatter || data.user || {};
      const senderId = String(sender.id || sender.user_id || 'unknown');
      const senderName = sender.username || sender.name || 'Chatter';
      const avatarUrl = sender.profile_pic || sender.profile_picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${senderName}`;
      const content = data.content || data.message || '';

      if (content && senderId !== 'unknown') {
        const streamId = String(data.stream_id || data.livestream_id || db.getActiveStreamId() || 'vod_live_active');
        const streamTitle = data.stream_title || db.getStreamById(streamId)?.title || db.getChannel().currentStreamTitle || 'Kick Broadcast';

        db.addChatMessage({
          kickUserId: senderId,
          username: senderName,
          avatarUrl,
          streamId,
          streamTitle,
          content,
          timestamp: data.created_at || new Date().toISOString()
        });
      }
    }
    // Handle new subscription
    else if (eventType.includes('subscription.new') || eventType.includes('subscription.renew') || eventType === 'Subscription') {
      const subscriber = data.subscriber || data.user || {};
      const subId = String(subscriber.id || subscriber.user_id || 'unknown');
      const subName = subscriber.username || subscriber.name || 'Subscriber';
      const avatarUrl = subscriber.profile_pic || `https://api.dicebear.com/7.x/bottts/svg?seed=${subName}`;

      if (subId !== 'unknown') {
        db.addPoints(subId, subName, avatarUrl, 'SUBSCRIPTION');
        db.addSystemLog('info', 'WEBHOOK', `Tracked subscription from ${subName} (+100 pts)`);
      }
    }
    // Handle gift subscriptions
    else if (eventType.includes('subscription.gift') || eventType === 'GiftSubscription') {
      const gifter = data.gifter || data.user || {};
      const gifterId = String(gifter.id || gifter.user_id || 'unknown');
      const gifterName = gifter.username || gifter.name || 'Gifter';
      const avatarUrl = gifter.profile_pic || `https://api.dicebear.com/7.x/bottts/svg?seed=${gifterName}`;
      const count = Number(data.gift_count || data.count || 1);

      if (gifterId !== 'unknown') {
        for (let i = 0; i < count; i++) {
          db.addPoints(gifterId, gifterName, avatarUrl, 'GIFT_SUBSCRIPTION');
        }
        db.addSystemLog('info', 'WEBHOOK', `Tracked ${count} Gift Sub(s) from ${gifterName} (+${count * 100} pts)`);
      }
    }
    // Handle livestream status update
    else if (eventType.includes('livestream') || eventType.includes('stream')) {
      const isLive = Boolean(data.is_live ?? (eventType === 'stream.online' || eventType === 'livestream.started'));
      db.updateChannel({
        isLive,
        currentViewers: isLive ? (data.viewer_count || data.viewers || 0) : 0,
        currentStreamTitle: data.session_title || data.title || db.getChannel().currentStreamTitle,
        currentStreamCategory: data.category?.name || data.category || db.getChannel().currentStreamCategory
      });
      db.addSystemLog('info', 'WEBHOOK', `Updated broadcast live status: ${isLive ? 'LIVE' : 'OFFLINE'}`);
    }
  } catch (err: any) {
    console.error('[Webhook] Error processing event:', err.message);
    db.addSystemLog('warn', 'WEBHOOK', `Failed parsing webhook payload: ${err.message}`);
  }

  res.status(200).json({ received: true, status: 'processed' });
});
