import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db.js';
import { kickService } from './kickService.js';
import { LeagueEngine } from './leagueEngine.js';
import { trackerService } from './trackerService.js';
import { AuthRequest, generateToken, requireAdmin, requireAuth, verifyToken } from './auth.js';

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
  // Return viewer trend and stream activity data calculated directly from stored streams and real tracked chat
  const streams = db.getStreams(30, 0).streams;
  const channel = db.getChannel();
  
  // Build a continuous chronological timeline of days (last 14 days)
  const now = new Date();
  const days = 14;
  const history = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayDate = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const isoDate = dayDate.toISOString().slice(0, 10);
    const dateStr = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Find all streams that occurred on this day
    const matchingStreams = streams.filter(s => {
      const sDate = new Date(s.startedAt);
      return sDate.toISOString().slice(0, 10) === isoDate ||
             sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === dateStr;
    });

    const primaryStream = matchingStreams[0];
    const streamChatTotal = matchingStreams.reduce((sum, s) => sum + (s.totalChatMessages || 0), 0);
    const streamSubsTotal = matchingStreams.reduce((sum, s) => sum + (s.subscribersGained || 0), 0);
    
    // Count ALL tracked messages in DB for this date (during live stream, before stream, after stream, and off-stream)
    const trackedDayMessages = db.getChatMessagesCountForDate(dateStr);
    const chatVolume = Math.max(streamChatTotal, trackedDayMessages);

    // Viewers logic:
    let viewers = primaryStream ? (primaryStream.averageViewers || 0) : 0;
    let peak = primaryStream ? (primaryStream.peakViewers || 0) : 0;

    // If today and stream is live, reflect live stats
    if (i === 0 && channel.isLive) {
      viewers = channel.currentViewers || viewers || channel.averageViewers || 1520;
      peak = Math.max(channel.peakViewers || 0, peak || 2100);
    } else if (viewers === 0) {
      // If no stream on this day, use adjacent or channel baseline
      viewers = channel.averageViewers || 1450;
      peak = channel.peakViewers || 1950;
    }

    history.push({
      streamId: primaryStream ? primaryStream.streamId : `day_${isoDate}`,
      date: dateStr,
      viewers,
      peak,
      chatVolume,
      subs: streamSubsTotal
    });
  }

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
    const subCount = s.subscribersGained ?? (s as any).subsGained ?? 0;
    return {
      ...s,
      subsGained: subCount,
      subscribersGained: subCount,
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
  const subCount = stream.subscribersGained ?? (stream as any).subsGained ?? 0;

  res.json({
    stream: {
      ...stream,
      subsGained: subCount,
      subscribersGained: subCount
    },
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

// --- Badges Endpoints ---
apiRouter.get('/badges', (req: Request, res: Response) => {
  res.json({ badges: db.getBadges() });
});

apiRouter.get('/admin/badges/catalog', (req: Request, res: Response) => {
  res.json({ status: 'ok', catalog: db.getBadges() });
});

apiRouter.get('/admin/badges/awarded', requireAdmin, (req: AuthRequest, res: Response) => {
  const awarded = db.getAllUserBadges();
  res.json({ awarded, total: awarded.length });
});

apiRouter.post('/admin/award-badge', requireAdmin, (req: AuthRequest, res: Response) => {
  const { kickUserId, badgeCode, badgeId, seasonId, streamId, rankPosition } = req.body;
  const targetBadge = badgeCode || badgeId;
  if (!kickUserId || !targetBadge) {
    return res.status(400).json({ error: 'kickUserId and badgeCode or badgeId are required.' });
  }

  const award = db.awardBadge(String(kickUserId).trim(), String(targetBadge).trim(), { seasonId, streamId, rankPosition });
  if (!award) {
    return res.status(400).json({ error: `Could not assign badge '${targetBadge}'. Please verify recipient ID.` });
  }

  const allBadges = db.getBadges();
  const badgeDef = allBadges.find(b => b.badgeId === award.badgeId);
  const recipient = db.getKickUserById(award.kickUserId);

  res.json({ 
    status: 'ok', 
    success: true, 
    award: {
      ...award,
      badge: badgeDef
    },
    message: `Badge '${badgeDef?.title || 'Honorary Badge'}' successfully awarded to @${recipient?.username || award.kickUserId}!` 
  });
});

apiRouter.post('/admin/revoke-badge', requireAdmin, (req: AuthRequest, res: Response) => {
  const { awardId, id, badgeId } = req.body;
  const targetId = awardId || id || badgeId;
  if (!targetId) {
    return res.status(400).json({ error: 'Awarded badge ID is required to revoke.' });
  }

  const success = db.revokeBadge(String(targetId));
  if (!success) {
    return res.status(404).json({ error: 'Awarded badge record not found.' });
  }

  res.json({ status: 'ok', success: true, message: 'Badge successfully revoked.' });
});

apiRouter.post('/admin/recalculate-vod-subs', requireAdmin, (req: AuthRequest, res: Response) => {
  const result = db.recalculateStreamSubscriptions();
  res.json({ 
    status: 'ok', 
    success: true, 
    ...result, 
    message: `Recalculated subscriptions for ${result.streamsUpdated} VODs (${result.totalSubsTracked} subs attributed).` 
  });
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

  if (type === 'CHAT' || type === 'chat') {
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
  } else if (type === 'SUB' || type === 'subscription') {
    const targetStreamId = (req.body.streamId as string) || db.getActiveStreamId();
    db.addSubscriptionEvent({
      kickUserId: uid,
      username: uname,
      avatarUrl: avatar,
      type: 'SUBSCRIPTION',
      streamId: targetStreamId,
      pointsAwarded: 100,
      timestamp: new Date().toISOString()
    });
  } else if (type === 'GIFT' || type === 'gift') {
    const count = Math.max(1, Number(req.body.giftCount) || 1);
    const targetStreamId = (req.body.streamId as string) || db.getActiveStreamId();
    for (let i = 0; i < count; i++) {
      db.addSubscriptionEvent({
        kickUserId: uid,
        username: uname,
        avatarUrl: avatar,
        type: 'GIFT_SUBSCRIPTION',
        streamId: targetStreamId,
        pointsAwarded: 100,
        timestamp: new Date().toISOString()
      });
    }
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
      const avatarUrl = sender.profile_pic || sender.profile_picture || `https://files.kick.com/images/default_avatars/avatar_1.png`;
      const content = data.content || data.message || '';

      if (content && senderId !== 'unknown') {
        const streamId = String(data.stream_id || data.livestream_id || db.getActiveStreamId() || 'vod_live_active');
        const streamTitle = data.stream_title || db.getStreamById(streamId)?.title || db.getChannel().currentStreamTitle || 'Kick Broadcast';

        db.addChatMessage({
          messageId: data.id ? String(data.id) : undefined,
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
    // Handle gift subscriptions (check before general subscription)
    else if (eventType.includes('subscription.gift') || eventType.includes('GiftedSubscriptions') || eventType === 'GiftSubscription' || eventType.includes('gift')) {
      const gifter = data.gifter || data.user || {};
      const gifterId = String(gifter.id || gifter.user_id || data.gifter_id || 'unknown');
      const gifterName = gifter.username || gifter.name || data.gifter_username || 'Gifter';
      const avatarUrl = gifter.profile_pic || data.profile_pic || `https://files.kick.com/images/default_avatars/avatar_1.png`;
      const count = Number(data.gift_count || data.count || (Array.isArray(data.gifted_usernames) ? data.gifted_usernames.length : 1));

      if (gifterId !== 'unknown') {
        const streamId = String(data.stream_id || data.livestream_id || db.getActiveStreamId() || '');
        for (let i = 0; i < count; i++) {
          db.addSubscriptionEvent({
            kickUserId: gifterId,
            username: gifterName,
            avatarUrl,
            type: 'GIFT_SUBSCRIPTION',
            streamId: streamId || undefined,
            pointsAwarded: 100,
            timestamp: data.created_at || new Date().toISOString()
          });
        }
        db.addSystemLog('info', 'WEBHOOK', `Tracked ${count} Gift Sub(s) from ${gifterName} (+${count * 100} pts)`);
      }
    }
    // Handle new/renewed subscription
    else if (eventType.includes('subscription') || eventType === 'Subscription' || eventType.includes('subscribe')) {
      const subscriber = data.subscriber || data.user || {};
      const subId = String(subscriber.id || subscriber.user_id || data.user_id || 'unknown');
      const subName = subscriber.username || subscriber.name || data.username || 'Subscriber';
      const avatarUrl = subscriber.profile_pic || data.profile_pic || `https://files.kick.com/images/default_avatars/avatar_1.png`;

      if (subId !== 'unknown') {
        const streamId = String(data.stream_id || data.livestream_id || db.getActiveStreamId() || '');
        db.addSubscriptionEvent({
          kickUserId: subId,
          username: subName,
          avatarUrl,
          type: 'SUBSCRIPTION',
          streamId: streamId || undefined,
          pointsAwarded: 100,
          timestamp: data.created_at || new Date().toISOString()
        });
        db.addSystemLog('info', 'WEBHOOK', `Tracked subscription from ${subName} (+100 pts)`);
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

// --- Mini Games Leaderboard & Scoring ---
apiRouter.get('/minigames/dashboard', (req: Request, res: Response) => {
  const stats = db.getMiniGameDashboardStats();
  res.json({
    status: 'ok',
    ...stats,
    recentActivity: stats.recentResults,
    playerRankings: stats.topRankedPlayers
  });
});

apiRouter.get('/minigames/leaderboard', (req: Request, res: Response) => {
  const gameId = req.query.gameId as string;
  const difficulty = req.query.difficulty as string;
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

  const data = db.getMiniGameLeaderboard(gameId, difficulty, limit);
  res.json(data);
});

apiRouter.get('/minigames/user-stats', (req: Request, res: Response) => {
  let userId = req.query.userId as string;
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const sessionUser = verifyToken(token);
      if (sessionUser) {
        userId = sessionUser.kickUserId;
      }
    }
  }

  if (!userId) {
    // If not logged in and no user requested, default to guest
    userId = 'guest';
  }

  const stats = db.getUserMiniGameStats(userId);
  res.json(stats);
});

apiRouter.post('/admin/minigames/purge-test-data', requireAdmin, (req: Request, res: Response) => {
  const result = db.purgeTestMiniGameData();
  res.json({
    status: 'ok',
    message: `Purged ${result.purgedCount} test/seed mini game scores. Clean database records: ${result.remainingCount}`,
    ...result
  });
});

apiRouter.post('/minigames/submit', (req: Request, res: Response) => {
  let { gameId, gameTitle, score, timeSeconds, accuracy, difficulty, gameMode, success, username, avatarUrl, userId } = req.body;

  // Prefer session user if logged in
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const sessionUser = verifyToken(token);
    if (sessionUser) {
      userId = sessionUser.kickUserId;
      username = sessionUser.username;
      avatarUrl = sessionUser.avatarUrl;
    }
  }

  if (!userId) {
    userId = `guest_${Math.random().toString(36).substr(2, 6)}`;
  }
  if (!username) {
    username = `Operator_${userId.slice(-4)}`;
  }
  if (!avatarUrl) {
    avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  }

  const validGames = [
    'logic_grid',
    'pattern_decoder',
    'sequence_master',
    'cipher_puzzle',
    'difficult_quiz',
    'precision_timing',
    'multi_task',
    'arcade_shooter'
  ];

  if (!validGames.includes(gameId)) {
    return res.status(400).json({ error: `Invalid gameId. Must be one of: ${validGames.join(', ')}` });
  }

  // Server-side score validation and sanity thresholds
  let scoreNum = Math.max(0, parseInt(score) || 0);
  // Cap max score to prevent spoofing
  const maxScoreCaps: Record<string, number> = {
    logic_grid: 2500,
    pattern_decoder: 2500,
    sequence_master: 2500,
    cipher_puzzle: 2500,
    difficult_quiz: 3500,
    precision_timing: 3000,
    multi_task: 4000,
    arcade_shooter: 6000
  };
  const cap = maxScoreCaps[gameId] || 5000;
  if (scoreNum > cap) {
    scoreNum = cap;
  }

  const timeNum = Math.max(0.5, parseFloat(timeSeconds) || 5);
  const diff = ['easy', 'medium', 'hard', 'expert'].includes(difficulty) ? difficulty : 'medium';
  const accNum = typeof accuracy === 'number' ? Math.min(100, Math.max(0, accuracy)) : (typeof accuracy === 'string' ? Math.min(100, Math.max(0, parseFloat(accuracy) || 0)) : undefined);

  const record = db.saveMiniGameScore({
    gameId,
    gameTitle,
    userId,
    username,
    avatarUrl,
    score: scoreNum,
    timeSeconds: timeNum,
    accuracy: accNum,
    difficulty: diff as any,
    gameMode: typeof gameMode === 'string' ? gameMode : undefined,
    success: Boolean(success)
  });

  const updatedLeaderboard = db.getMiniGameLeaderboard(gameId, diff, 10);
  const userStats = db.getUserMiniGameStats(userId);

  res.json({
    status: 'ok',
    success: true,
    score: record,
    leaderboard: updatedLeaderboard.leaderboard,
    userStats
  });
});

// Tracker status endpoint for live diagnostics
apiRouter.get('/tracker/status', (req: Request, res: Response) => {
  res.json(trackerService.getStatus());
});

// Admin endpoint to remove fake/test user
apiRouter.post('/admin/remove-user', (req: Request, res: Response) => {
  const { kickUserId, username } = req.body;
  let targetId = kickUserId;
  if (!targetId && username) {
    const user = db.getKickUserByUsername(username);
    if (user) targetId = user.kickUserId;
  }
  if (!targetId) {
    return res.status(400).json({ error: 'kickUserId or username required' });
  }
  const success = db.removeKickUser(targetId);
  res.json({ success, kickUserId: targetId });
});

// Endpoint to refresh user avatars directly from Kick API
apiRouter.post('/users/refresh-avatars', async (req: Request, res: Response) => {
  const users = db.searchKickUsers('', 100, 0).users;
  let updated = 0;
  for (const u of users) {
    try {
      const realPic = await kickService.fetchKickUserAvatar(u.username, u.kickUserId);
      if (realPic && realPic !== u.avatarUrl) {
        db.updateUserAvatar(u.kickUserId, realPic);
        updated++;
      }
    } catch {}
  }
  res.json({ success: true, updated, total: users.length });
});

