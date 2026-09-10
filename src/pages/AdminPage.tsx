import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchAdminOverview, 
  updateAdminPointRules, 
  finalizeSeason, 
  updateAdminUserPoints, 
  awardAdminBadge, 
  revokeAdminBadge,
  fetchAwardedBadges,
  fetchBadgesCatalog,
  recalculateVodSubs,
  dispatchSimulatorEvent, 
  syncKickChannelStats, 
  updateChannelStats
} from '../lib/api';
import { AdminOverviewData, Badge } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { BadgeItem } from '../components/BadgeItem';
import { UserAvatar } from '../components/UserAvatar';
import { 
  ShieldAlert, 
  Sliders, 
  Trophy, 
  Users, 
  Video, 
  Activity, 
  Zap, 
  RefreshCw, 
  Award, 
  Lock, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  Send,
  Sparkles,
  Trash2,
  Calendar,
  Check
} from 'lucide-react';

export const AdminPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { isAuthenticated, isAdmin, showToast } = useAuth();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'simulator' | 'users' | 'badges' | 'channel'>('rules');

  // Point rule form state
  const [msgPoints, setMsgPoints] = useState<number>(1);
  const [subPoints, setSubPoints] = useState<number>(100);
  const [giftPoints, setGiftPoints] = useState<number>(100);

  // User point adjustment form state
  const [selectedUserId, setSelectedUserId] = useState<string>('102938');
  const [pointDelta, setPointDelta] = useState<number>(50);
  const [pointReason, setPointReason] = useState<string>('Tournament MVP Bonus');

  // Badge award form state
  const [badgeTargetUser, setBadgeTargetUser] = useState<string>('102938');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('b_vod_top');
  const [customBadgeCode, setCustomBadgeCode] = useState<string>('');
  const [customUserId, setCustomUserId] = useState<string>('');
  const [useCustomUser, setUseCustomUser] = useState<boolean>(false);
  const [catalogBadges, setCatalogBadges] = useState<Badge[]>([]);
  const [awardedBadgesList, setAwardedBadgesList] = useState<any[]>([]);
  const [loadingBadges, setLoadingBadges] = useState<boolean>(false);
  const [awardingBadge, setAwardingBadge] = useState<boolean>(false);
  const [lastAwardedResult, setLastAwardedResult] = useState<any | null>(null);

  // VOD Subs recalculation state
  const [recalculatingSubs, setRecalculatingSubs] = useState<boolean>(false);
  const [recalcSummary, setRecalcSummary] = useState<string | null>(null);

  // Simulator state
  const [simUsername, setSimUsername] = useState<string>('ApexLegend99');
  const [simEventType, setSimEventType] = useState<'chat' | 'subscription' | 'gift'>('chat');
  const [simMessage, setSimMessage] = useState<string>('SLYYUTUS KINGDOM ON TOP! 🔥🔥');
  const [simGiftCount, setSimGiftCount] = useState<number>(5);

  // Channel config state
  const [followersCount, setFollowersCount] = useState<number>(48920);
  const [subscribersCount, setSubscribersCount] = useState<number>(1420);
  const [currentViewers, setCurrentViewers] = useState<number>(642);
  const [averageViewers, setAverageViewers] = useState<number>(580);
  const [peakViewers, setPeakViewers] = useState<number>(2890);
  const [streamTitle, setStreamTitle] = useState<string>('');
  const [streamCategory, setStreamCategory] = useState<string>('Apex Legends');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const res = await fetchAdminOverview();
      setData(res);
      if (res.pointRules) {
        setMsgPoints(res.pointRules.CHAT_MESSAGE || 1);
        setSubPoints(res.pointRules.SUBSCRIPTION || 100);
        setGiftPoints(res.pointRules.GIFT_SUBSCRIPTION || 100);
      }
      if (res.channel) {
        setFollowersCount(res.channel.followersCount || 0);
        setSubscribersCount(res.channel.subscribersCount || 0);
        setCurrentViewers(res.channel.currentViewers || 0);
        setAverageViewers(res.channel.averageViewers || 0);
        setPeakViewers(res.channel.peakViewers || 0);
        setStreamTitle(res.channel.currentStreamTitle || '');
        setStreamCategory(res.channel.currentStreamCategory || 'Gaming');
        setIsLive(res.channel.isLive);
      }
    } catch (err: any) {
      showToast('Admin data fetch error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBadgeData = async () => {
    try {
      setLoadingBadges(true);
      const [catalog, awarded] = await Promise.all([
        fetchBadgesCatalog().catch(() => []),
        fetchAwardedBadges().catch(() => [])
      ]);
      if (catalog && catalog.length > 0) {
        setCatalogBadges(catalog);
        setSelectedBadgeId(prev => (prev && catalog.some(c => c.badgeId === prev) ? prev : catalog[0].badgeId));
      }
      setAwardedBadgesList(awarded || []);
    } catch (e) {
      console.error('Error loading badges:', e);
    } finally {
      setLoadingBadges(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
      loadBadgeData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-heading text-zinc-100 uppercase">
          Access Restricted
        </h2>
        <p className="text-xs font-mono text-zinc-400">
          The Admin Control Panel requires administrative credentials. Please log in with an admin account.
        </p>
        <button
          onClick={() => navigate('login')}
          className="px-6 py-2.5 rounded-xl bg-amber-400 text-zinc-950 font-heading font-bold uppercase text-xs"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton type="profile" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAdminPointRules({
        CHAT_MESSAGE: Number(msgPoints),
        SUBSCRIPTION: Number(subPoints),
        GIFT_SUBSCRIPTION: Number(giftPoints)
      });
      showToast('Point rules successfully updated!', 'success');
      loadData();
    } catch (err: any) {
      showToast('Failed updating rules: ' + err.message, 'error');
    }
  };

  const handleFinalizeSeason = async () => {
    if (!window.confirm('Are you sure you want to finalize the active season? This will permanently award badges to the top 3 chatters and start the next monthly season.')) {
      return;
    }
    try {
      const res = await finalizeSeason(data.activeSeason.seasonId);
      showToast(res.message, 'success');
      loadData();
    } catch (err: any) {
      showToast('Finalize season error: ' + err.message, 'error');
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAdminUserPoints(selectedUserId, Number(pointDelta), pointReason);
      showToast(`Adjusted points for user ID ${selectedUserId}`, 'success');
      loadData();
    } catch (err: any) {
      showToast('Error adjusting points: ' + err.message, 'error');
    }
  };

  const handleAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUserId = useCustomUser ? customUserId.trim() : (badgeTargetUser || customUserId.trim());
    const finalBadge = customBadgeCode.trim() || selectedBadgeId;

    if (!finalUserId) {
      showToast('Please specify a recipient user ID or username', 'error');
      return;
    }
    if (!finalBadge) {
      showToast('Please select or specify a badge to award', 'error');
      return;
    }

    try {
      setAwardingBadge(true);
      const res = await awardAdminBadge(finalUserId, finalBadge);
      showToast(res.message || `Badge successfully awarded to ${finalUserId}!`, 'success');
      setLastAwardedResult(res.award || {
        badgeId: finalBadge,
        kickUserId: finalUserId,
        awardedAt: new Date().toISOString()
      });
      setCustomBadgeCode('');
      setCustomUserId('');
      await Promise.all([loadData(), loadBadgeData()]);
    } catch (err: any) {
      showToast(err.message || 'Error awarding badge', 'error');
    } finally {
      setAwardingBadge(false);
    }
  };

  const handleRevokeBadge = async (awardId: string, badgeTitle: string, username: string) => {
    if (!window.confirm(`Revoke badge "${badgeTitle}" from @${username}?`)) return;
    try {
      const res = await revokeAdminBadge(awardId);
      showToast(res.message || `Badge "${badgeTitle}" revoked`, 'success');
      await Promise.all([loadData(), loadBadgeData()]);
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke badge', 'error');
    }
  };

  const handleRecalculateSubs = async () => {
    try {
      setRecalculatingSubs(true);
      const res = await recalculateVodSubs();
      showToast(res.message || 'VOD subscriptions recalculated successfully!', 'success');
      setRecalcSummary(res.message);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error recalculating subscriptions', 'error');
    } finally {
      setRecalculatingSubs(false);
    }
  };

  const handleDispatchEvent = async () => {
    try {
      await dispatchSimulatorEvent({
        type: simEventType,
        username: simUsername,
        content: simMessage,
        giftCount: simEventType === 'gift' ? Number(simGiftCount) : undefined
      });
      showToast(`Simulated ${simEventType.toUpperCase()} event dispatched!`, 'success');
      loadData();
    } catch (err: any) {
      showToast('Error dispatching simulator event: ' + err.message, 'error');
    }
  };

  const handleSyncKick = async () => {
    setSyncing(true);
    try {
      const res = await syncKickChannelStats();
      showToast('Kick channel data synchronized from Kick API!', 'success');
      loadData();
    } catch (err: any) {
      showToast('Sync error: ' + err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveChannelStats = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateChannelStats({
        followersCount: Number(followersCount),
        subscribersCount: Number(subscribersCount),
        currentViewers: Number(currentViewers),
        averageViewers: Number(averageViewers),
        peakViewers: Number(peakViewers),
        isLive,
        currentStreamTitle: streamTitle,
        currentStreamCategory: streamCategory
      });
      showToast('Channel metrics successfully updated!', 'success');
      loadData();
    } catch (err: any) {
      showToast('Error saving metrics: ' + err.message, 'error');
    }
  };

  const handleToggleLive = async () => {
    try {
      const newLive = !data.channel.isLive;
      await updateChannelStats({
        isLive: newLive,
        currentStreamTitle: newLive ? (streamTitle || 'Competitive Apex Grind') : 'Stream Offline'
      });
      showToast(`Channel broadcast status set to ${newLive ? 'LIVE' : 'OFFLINE'}`, 'success');
      loadData();
    } catch (err: any) {
      showToast('Error toggling live: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Master Control & League Administration</span>
          </div>
          <h1 className="text-3xl font-black font-heading gold-gradient-text uppercase">
            Admin Control Panel
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncKick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-xs font-mono text-zinc-200"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Sync Kick Data</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-heading tracking-wider transition-all flex items-center gap-1.5 ${
            activeTab === 'rules' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Point Rules & Seasons</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-heading tracking-wider transition-all flex items-center gap-1.5 ${
            activeTab === 'simulator' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Live Event Simulator</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-heading tracking-wider transition-all flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User & Point Adjuster</span>
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-heading tracking-wider transition-all flex items-center gap-1.5 ${
            activeTab === 'badges' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Badge Minting Tool</span>
        </button>
        <button
          onClick={() => setActiveTab('channel')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-heading tracking-wider transition-all flex items-center gap-1.5 ${
            activeTab === 'channel' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Channel & Live Status</span>
        </button>
      </div>

      {/* Tab: Point Rules & Seasons */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Rules Editor */}
          <form onSubmit={handleSaveRules} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Configure League Point Rules</span>
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Adjust points awarded per event. Changes affect all subsequent events in real-time.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Chat Message Points
                </label>
                <input
                  type="number"
                  value={msgPoints}
                  onChange={(e) => setMsgPoints(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Subscription / Resub Points
                </label>
                <input
                  type="number"
                  value={subPoints}
                  onChange={(e) => setSubPoints(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Gifted Sub Points (Per Gift)
                </label>
                <input
                  type="number"
                  value={giftPoints}
                  onChange={(e) => setGiftPoints(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-400 text-zinc-950 font-heading font-extrabold uppercase text-xs hover:bg-amber-300 transition-all"
            >
              SAVE POINT RULES
            </button>
          </form>

          {/* Active Season Finalizer */}
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-zinc-900/60 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Active Season Finalizer</span>
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Season ID:</span>
                  <span className="font-bold text-amber-300">{data.activeSeason.seasonId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Season Name:</span>
                  <span className="text-zinc-200">{data.activeSeason.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Active Participants:</span>
                  <span className="text-zinc-200">{data.totalUsers}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Finalization Actions:</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Finalizing will freeze this month's standings, permanently mint 1st, 2nd, and 3rd place badges to the top 3 chatters, archive the leaderboard, and initiate the next monthly season.
                </p>
              </div>
            </div>

            <button
              onClick={handleFinalizeSeason}
              className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-heading font-extrabold uppercase text-xs transition-all shadow-lg"
            >
              FINALIZE SEASON {data.activeSeason.seasonId} & AWARD BADGES
            </button>
          </div>

        </div>
      )}

      {/* Tab: Live Simulator */}
      {activeTab === 'simulator' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl border border-amber-500/40 bg-zinc-900/80 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-heading text-amber-300 uppercase flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Interactive Live Event Dispatcher</span>
            </h3>
            <p className="text-xs font-mono text-zinc-400">
              Dispatch simulated real-time events to test score calculation, tie-breaking, and instant leaderboard rank updates.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                Chatter Username
              </label>
              <input
                type="text"
                value={simUsername}
                onChange={(e) => setSimUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                Event Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSimEventType('chat')}
                  className={`py-2 rounded-xl text-xs font-mono uppercase font-bold border transition-all ${
                    simEventType === 'chat' ? 'bg-amber-400 text-zinc-950 border-amber-400' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  Chat Message (+{msgPoints} pt)
                </button>
                <button
                  type="button"
                  onClick={() => setSimEventType('subscription')}
                  className={`py-2 rounded-xl text-xs font-mono uppercase font-bold border transition-all ${
                    simEventType === 'subscription' ? 'bg-amber-400 text-zinc-950 border-amber-400' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  Sub (+{subPoints} pts)
                </button>
                <button
                  type="button"
                  onClick={() => setSimEventType('gift')}
                  className={`py-2 rounded-xl text-xs font-mono uppercase font-bold border transition-all ${
                    simEventType === 'gift' ? 'bg-amber-400 text-zinc-950 border-amber-400' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  Gifted Subs
                </button>
              </div>
            </div>

            {simEventType === 'chat' && (
              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Message Content
                </label>
                <input
                  type="text"
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {simEventType === 'gift' && (
              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Number of Subs Gifted (+{simGiftCount * giftPoints} pts)
                </label>
                <input
                  type="number"
                  value={simGiftCount}
                  onChange={(e) => setSimGiftCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleDispatchEvent}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-heading font-extrabold uppercase text-xs hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" />
            <span>DISPATCH SIMULATED EVENT</span>
          </button>
        </div>
      )}

      {/* Tab: Users & Point Adjuster */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleAdjustPoints} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Manual Point Adjustment</span>
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Grant bonus points or apply penalty deductions to a user's active season score.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Select Target User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  {(data.recentUsers || []).map((u) => (
                    <option key={u.kickUserId} value={u.kickUserId}>
                      {u.username} (ID: {u.kickUserId} • {u.points} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Point Delta (Positive or Negative)
                </label>
                <input
                  type="number"
                  value={pointDelta}
                  onChange={(e) => setPointDelta(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Reason / Audit Log Note
                </label>
                <input
                  type="text"
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-400 text-zinc-950 font-heading font-extrabold uppercase text-xs hover:bg-amber-300 transition-all"
            >
              APPLY POINT ADJUSTMENT
            </button>
          </form>

          {/* User List Preview */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
            <h3 className="text-lg font-bold font-heading text-zinc-100 uppercase">
              Top Community Members
            </h3>
            <div className="divide-y divide-zinc-800/80 text-xs font-mono max-h-80 overflow-y-auto">
              {(data.recentUsers || []).map((u) => (
                <div key={u.kickUserId} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-200">{u.username}</span>
                    <span className="text-zinc-500 block text-[10px]">ID: {u.kickUserId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold">{(u.points || 0).toLocaleString()} pts</span>
                    <span className="text-zinc-500 block text-[10px]">{(u.totalChatMessages || 0).toLocaleString()} msgs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Badge Minting */}
      {activeTab === 'badges' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Award Form */}
            <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Direct Badge Awarder</span>
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  Assign permanent badges to any community member. Badges are persisted to database storage and immediately visible on user profiles.
                </p>
              </div>

              {/* Success Card if recently awarded */}
              {lastAwardedResult && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start justify-between gap-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-heading uppercase text-emerald-300">
                        Badge Successfully Awarded!
                      </h4>
                      <p className="text-[11px] font-mono text-zinc-300 mt-0.5">
                        Badge <span className="text-amber-400 font-bold">{lastAwardedResult.badgeId}</span> assigned to recipient <span className="text-white font-bold">{lastAwardedResult.kickUserId}</span>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLastAwardedResult(null)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs font-mono"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <form onSubmit={handleAwardBadge} className="space-y-5">
                {/* User selection mode */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-mono text-zinc-300 uppercase font-bold">
                      Recipient User
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseCustomUser(!useCustomUser)}
                      className="text-[11px] font-mono text-amber-400 hover:underline"
                    >
                      {useCustomUser ? '← Choose from Community List' : '+ Enter Custom Username / ID'}
                    </button>
                  </div>

                  {useCustomUser ? (
                    <input
                      type="text"
                      value={customUserId}
                      onChange={(e) => setCustomUserId(e.target.value)}
                      placeholder="e.g. ApexLegend99 or Kick user ID 102938"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <select
                      value={badgeTargetUser}
                      onChange={(e) => setBadgeTargetUser(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                    >
                      {(data.recentUsers || []).map((u) => (
                        <option key={u.kickUserId} value={u.kickUserId}>
                          {u.username} (ID: {u.kickUserId} • {u.points} pts)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Badge selection */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1.5">
                    Select Badge to Grant
                  </label>
                  <select
                    value={selectedBadgeId}
                    onChange={(e) => {
                      setSelectedBadgeId(e.target.value);
                      setCustomBadgeCode('');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    {(catalogBadges.length > 0 ? catalogBadges : (data.badgesCatalog || [])).map((b) => (
                      <option key={b.badgeId} value={b.badgeId}>
                        {b.title} — [{b.badgeTier.toUpperCase()}] {b.description}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={customBadgeCode}
                      onChange={(e) => setCustomBadgeCode(e.target.value)}
                      placeholder="Or enter custom badge ID / code (optional)..."
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Selected Badge Preview */}
                {(() => {
                  const currentBadge = (catalogBadges.length > 0 ? catalogBadges : data.badgesCatalog || []).find(
                    b => b.badgeId === (customBadgeCode.trim() || selectedBadgeId)
                  ) || {
                    badgeId: customBadgeCode || selectedBadgeId,
                    title: customBadgeCode || selectedBadgeId,
                    description: 'Custom administrative badge',
                    iconType: 'award',
                    badgeTier: 'gold',
                    permanent: true
                  };

                  return (
                    <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-black text-sm uppercase text-white truncate">
                            {currentBadge.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                            {currentBadge.badgeTier}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 truncate">
                          {currentBadge.description}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  disabled={awardingBadge}
                  className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-heading font-extrabold uppercase text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {awardingBadge ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ASSIGNING BADGE...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>MINT AND AWARD BADGE</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Catalog Reference */}
            <div className="lg:col-span-5 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Available Badge Catalog</span>
                </h3>
                <span className="text-xs font-mono text-zinc-500">
                  {catalogBadges.length || data.badgesCatalog?.length || 0} badges
                </span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {(catalogBadges.length > 0 ? catalogBadges : data.badgesCatalog || []).map((b) => (
                  <div
                    key={b.badgeId}
                    onClick={() => {
                      setSelectedBadgeId(b.badgeId);
                      setCustomBadgeCode('');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      selectedBadgeId === b.badgeId && !customBadgeCode
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-bold text-xs uppercase text-zinc-200 block truncate">
                          {b.title}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 block truncate">
                          {b.description}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold uppercase shrink-0">
                      {b.badgeTier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Awarded Badges Management Table */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Currently Awarded Badges & Assignments</span>
                </h3>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  Full registry of user badges stored in database. Admins can view assignments or revoke at any time.
                </p>
              </div>
              <button
                onClick={loadBadgeData}
                disabled={loadingBadges}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loadingBadges ? 'animate-spin' : ''}`} />
                <span>Refresh Registry</span>
              </button>
            </div>

            {loadingBadges ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-500">
                Loading awarded badges...
              </div>
            ) : awardedBadgesList.length === 0 ? (
              <div className="py-10 text-center font-mono text-xs text-zinc-500 space-y-2">
                <Award className="w-8 h-8 text-zinc-600 mx-auto" />
                <p>No user badges recorded yet. Use the awarder above to grant the first badge.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[11px] text-zinc-500 uppercase">
                      <th className="py-3 px-3">Recipient</th>
                      <th className="py-3 px-3">Badge Title</th>
                      <th className="py-3 px-3">Tier</th>
                      <th className="py-3 px-3">Context / Reason</th>
                      <th className="py-3 px-3">Date Awarded</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {awardedBadgesList.map((item) => (
                      <tr key={item.awardId || item.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              src={item.userAvatar || item.avatarUrl}
                              username={item.username || item.kickUserId}
                              userId={item.kickUserId}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div>
                              <span className="font-bold text-zinc-200">@{item.username || 'user'}</span>
                              <span className="text-[10px] text-zinc-500 block">ID: {item.kickUserId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-300">
                          {item.badgeTitle || item.title || item.badgeId}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-300 uppercase">
                            {item.badgeTier || 'gold'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-[11px]">
                          {item.seasonId ? `Season ${item.seasonId}` : item.streamId ? `VOD ${item.streamId}` : 'Admin Grant'}
                        </td>
                        <td className="py-3 px-3 text-zinc-500 text-[11px]">
                          {item.awardedAt ? new Date(item.awardedAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleRevokeBadge(item.awardId || item.id, item.badgeTitle || item.badgeId, item.username || item.kickUserId)}
                            title="Revoke Badge"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 transition-colors inline-flex items-center gap-1 text-[10px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revoke</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Channel Status & Metrics Editor */}
      {activeTab === 'channel' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Quick Sync Card */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-amber-400 ${syncing ? 'animate-spin' : ''}`} />
                <span>Kick API Auto-Sync</span>
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Poll Kick public endpoints and sync live follower counts, stream title, and live status for @slyyutus.
              </p>
            </div>
            <button
              onClick={handleSyncKick}
              disabled={syncing}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-heading font-extrabold uppercase text-xs flex items-center gap-2 transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'SYNCING...' : 'SYNC LIVE FROM KICK'}</span>
            </button>
          </div>

          {/* VOD Subscription Recalculator Card */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>VOD Subscriptions Recalculator</span>
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  Recalculates and attributes subscription and gift events to their corresponding stream VODs based on broadcast timestamps, ensuring accurate subs gained stats without overlapping duplicates.
                </p>
              </div>
              <button
                onClick={handleRecalculateSubs}
                disabled={recalculatingSubs}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-heading font-extrabold uppercase text-xs flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${recalculatingSubs ? 'animate-spin' : ''}`} />
                <span>{recalculatingSubs ? 'RECALCULATING...' : 'RECALCULATE VOD SUBS'}</span>
              </button>
            </div>

            {recalcSummary && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{recalcSummary}</span>
              </div>
            )}
          </div>

          {/* Detailed Metric Editor Form */}
          <form onSubmit={handleSaveChannelStats} className="p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <span>Channel Statistics & Stream Metrics Editor</span>
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Customize or fine-tune exact followers, subscribers, and viewership numbers to match your real channel.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Followers Count
                </label>
                <input
                  type="number"
                  value={followersCount}
                  onChange={(e) => setFollowersCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Subscribers Count
                </label>
                <input
                  type="number"
                  value={subscribersCount}
                  onChange={(e) => setSubscribersCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Current Live Viewers
                </label>
                <input
                  type="number"
                  value={currentViewers}
                  onChange={(e) => setCurrentViewers(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Average Viewers
                </label>
                <input
                  type="number"
                  value={averageViewers}
                  onChange={(e) => setAverageViewers(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Peak Viewers Record
                </label>
                <input
                  type="number"
                  value={peakViewers}
                  onChange={(e) => setPeakViewers(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                  Live Stream Category
                </label>
                <input
                  type="text"
                  value={streamCategory}
                  onChange={(e) => setStreamCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 uppercase font-bold mb-1">
                Stream Title
              </label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Stream title..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div>
                <span className="text-xs font-mono uppercase font-bold text-zinc-200 block">Stream Live Status</span>
                <span className="text-[11px] font-mono text-zinc-400">Set whether Slyyutus is currently broadcasting on Kick</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLive(!isLive)}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold uppercase transition-all ${
                  isLive ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {isLive ? 'BROADCASTING LIVE' : 'OFFLINE'}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-heading font-extrabold uppercase text-xs transition-all shadow-lg"
            >
              SAVE UPDATED CHANNEL METRICS
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
