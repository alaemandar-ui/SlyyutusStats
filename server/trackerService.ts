import { db } from './db.js';
import { kickService } from './kickService.js';
import { LeagueEngine } from './leagueEngine.js';

export class TrackerService {
  private isRunning: boolean = false;
  private ws: any = null;
  private wsStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private syncIntervalId: NodeJS.Timeout | null = null;
  private chatPollIntervalId: NodeJS.Timeout | null = null;
  private watchdogIntervalId: NodeJS.Timeout | null = null;
  private pingIntervalId: NodeJS.Timeout | null = null;

  public readonly channelSlug: string = 'slyyutus';
  public channelId: number = 229384;
  public chatroomId: number = 229380;
  public broadcasterUserId: number = 231626;

  private totalTrackedThisSession: number = 0;
  private lastMessageAt: string | null = null;
  private lastCheckAt: string = new Date().toISOString();

  // Known Kick Pusher WebSocket configuration
  private readonly pusherAppKey: string = '32cbd69e4b950bf97679';
  private readonly pusherCluster: string = 'us2';

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Tracker] Starting Slyyutus Kick real-time tracking service (WebSocket + Polling)...');
    db.addSystemLog('info', 'TRACKER', 'Starting Kick real-time tracking service with WebSocket & API fallback.');

    // 1. Check League Month transition
    LeagueEngine.checkMonthTransition();

    // 2. Resolve dynamic channel and chatroom identifiers
    await this.resolveChannelInfo();

    // 3. Connect real-time Pusher WebSocket
    this.connectPusher();

    // 4. Initial sync of channel metadata and streams
    kickService.syncChannelStats().then(() => {
      const channel = db.getChannel();
      if (channel.userId) {
        this.broadcasterUserId = channel.userId;
      }
      // Register webhook subscriptions as well (if public webhook URL is configured)
      kickService.subscribeToEvents(this.broadcasterUserId);
    }).catch(err => {
      console.warn('[Tracker] Initial syncChannelStats notice:', err.message);
    });

    // 5. Start fast chat polling loop (every 3 seconds) for instant catch-up and 100% message reliability
    this.chatPollIntervalId = setInterval(() => {
      if (!this.isRunning) return;
      this.pollKickChatMessages();
    }, 3000);
    // Trigger immediate first poll
    this.pollKickChatMessages();

    // 6. Background interval for full channel stats and stream status (every 60 seconds)
    this.syncIntervalId = setInterval(() => {
      if (!this.isRunning) return;
      this.lastCheckAt = new Date().toISOString();
      kickService.syncChannelStats();
      LeagueEngine.checkMonthTransition();
    }, 60000);

    // 7. Watchdog timer (every 15 seconds) to ensure WebSocket remains connected
    this.watchdogIntervalId = setInterval(() => {
      if (!this.isRunning) return;
      if (!this.ws || this.ws.readyState === 2 || this.ws.readyState === 3) {
        if (this.wsStatus !== 'connecting') {
          console.log('[Tracker Watchdog] WebSocket disconnected. Reconnecting...');
          this.connectPusher();
        }
      }
    }, 15000);
  }

  public stop() {
    this.isRunning = false;
    this.wsStatus = 'disconnected';

    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    if (this.chatPollIntervalId) {
      clearInterval(this.chatPollIntervalId);
      this.chatPollIntervalId = null;
    }
    if (this.watchdogIntervalId) {
      clearInterval(this.watchdogIntervalId);
      this.watchdogIntervalId = null;
    }
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    console.log('[Tracker] Stopped Slyyutus Kick real-time tracking service.');
    db.addSystemLog('info', 'TRACKER', 'Kick tracking service stopped.');
  }

  /**
   * Dynamically resolves chatroom ID, channel ID, and broadcaster user ID from Kick's public endpoint
   */
  private async resolveChannelInfo(): Promise<void> {
    try {
      const res = await fetch(`https://kick.com/api/v1/channels/${this.channelSlug}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) this.channelId = data.id;
        if (data.chatroom?.id) this.chatroomId = data.chatroom.id;
        if (data.user_id) this.broadcasterUserId = data.user_id;
        console.log(`[Tracker] Resolved @${this.channelSlug}: channelId=${this.channelId}, chatroomId=${this.chatroomId}, userId=${this.broadcasterUserId}`);
      }
    } catch (err: any) {
      console.warn(`[Tracker] Using default channel identifiers for @${this.channelSlug}:`, err.message);
    }
  }

  /**
   * Connects to Kick's Pusher WebSocket server and subscribes to the channel's chatroom and event channels
   */
  private connectPusher() {
    if (!this.isRunning) return;
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) {
      return;
    }

    this.wsStatus = 'connecting';
    const wsUrl = `wss://ws-${this.pusherCluster}.pusher.com/app/${this.pusherAppKey}?protocol=7&client=js&version=8.4.0-rc2&flash=false`;
    console.log(`[Kick WebSocket] Connecting to ${wsUrl}...`);

    try {
      // Node 22 provides globalThis.WebSocket
      const WS = (globalThis as any).WebSocket;
      if (!WS) {
        console.error('[Kick WebSocket] Native WebSocket not available in environment.');
        this.wsStatus = 'disconnected';
        return;
      }

      this.ws = new WS(wsUrl);

      this.ws.onopen = () => {
        console.log('[Kick WebSocket] Socket connection opened.');
      };

      this.ws.onmessage = (event: any) => {
        this.handlePusherMessage(event.data);
      };

      this.ws.onerror = (err: any) => {
        console.error('[Kick WebSocket] Error encountered:', err?.message || err);
      };

      this.ws.onclose = (event: any) => {
        this.wsStatus = 'disconnected';
        this.ws = null;
        if (this.pingIntervalId) {
          clearInterval(this.pingIntervalId);
          this.pingIntervalId = null;
        }

        if (this.isRunning) {
          console.warn(`[Kick WebSocket] Disconnected (code: ${event?.code || 'unknown'}). Scheduling reconnect in 4s...`);
          if (!this.reconnectTimeoutId) {
            this.reconnectTimeoutId = setTimeout(() => {
              this.reconnectTimeoutId = null;
              this.connectPusher();
            }, 4000);
          }
        }
      };

      // Periodic ping to keep connection healthy
      if (this.pingIntervalId) clearInterval(this.pingIntervalId);
      this.pingIntervalId = setInterval(() => {
        if (this.ws && this.ws.readyState === 1) {
          try {
            this.ws.send(JSON.stringify({ event: 'pusher:ping', data: {} }));
          } catch {}
        }
      }, 45000);

    } catch (err: any) {
      console.error('[Kick WebSocket] Failed to initialize WebSocket client:', err.message);
      this.wsStatus = 'disconnected';
      if (this.isRunning && !this.reconnectTimeoutId) {
        this.reconnectTimeoutId = setTimeout(() => {
          this.reconnectTimeoutId = null;
          this.connectPusher();
        }, 5000);
      }
    }
  }

  /**
   * Processes protocol messages from Pusher WebSocket
   */
  private handlePusherMessage(rawData: any) {
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const eventName = parsed.event;
      let eventPayload = parsed.data;

      if (typeof eventPayload === 'string') {
        try {
          eventPayload = JSON.parse(eventPayload);
        } catch {}
      }

      // 1. Connection established: subscribe to chatrooms and channel events
      if (eventName === 'pusher:connection_established') {
        this.wsStatus = 'connected';
        console.log('[Kick WebSocket] Connection established! Subscribing to chatroom & channel...');
        db.addSystemLog('success', 'TRACKER', `Kick WebSocket connected. Subscribing to chatroom ${this.chatroomId}.`);

        // Subscribe to live chatroom v2
        this.ws?.send(JSON.stringify({
          event: 'pusher:subscribe',
          data: { auth: '', channel: `chatrooms.${this.chatroomId}.v2` }
        }));

        // Subscribe to channel notifications (stream online/offline, subs, followers)
        this.ws?.send(JSON.stringify({
          event: 'pusher:subscribe',
          data: { auth: '', channel: `channel.${this.channelId}` }
        }));

        if (this.broadcasterUserId && this.broadcasterUserId !== this.channelId) {
          this.ws?.send(JSON.stringify({
            event: 'pusher:subscribe',
            data: { auth: '', channel: `channel.${this.broadcasterUserId}` }
          }));
        }
      }
      // 2. Ping from server: reply with pong
      else if (eventName === 'pusher:ping') {
        if (this.ws && this.ws.readyState === 1) {
          this.ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
        }
      }
      // 3. Subscription confirmed
      else if (eventName === 'pusher_internal:subscription_succeeded') {
        console.log(`[Kick WebSocket] Successfully subscribed to channel: ${parsed.channel}`);
      }
      // 4. Chat message sent in real-time
      else if (eventName.includes('ChatMessage') || eventName.includes('chat.message')) {
        this.processChatMessage(eventPayload, 'WEBSOCKET');
      }
      // 5. Gifted subscriptions event (check before standard subscription)
      else if (eventName.includes('GiftedSubscriptions') || eventName.includes('subscription.gift') || (eventName.includes('Gift') && eventName.includes('Sub'))) {
        this.processGiftedSubscriptionEvent(eventPayload);
      }
      // 6. Subscription event
      else if (eventName.includes('Subscription') || eventName.includes('subscription')) {
        this.processSubscriptionEvent(eventPayload);
      }
      // 7. Livestream status events
      else if (eventName.includes('Livestream') || eventName.includes('StreamOnline') || eventName.includes('StreamOffline')) {
        kickService.syncChannelStats();
      }
    } catch (err: any) {
      console.error('[Kick WebSocket] Error handling message:', err.message);
    }
  }

  /**
   * Fast polling of Kick's channel messages endpoint.
   * Catches any messages sent when WebSocket is reconnecting or before connection, ensuring zero message loss.
   */
  private async pollKickChatMessages() {
    try {
      const res = await fetch(`https://kick.com/api/v2/channels/${this.channelId}/messages`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) return;

      const data = await res.json();
      const messages = data.data?.messages;
      if (!Array.isArray(messages) || messages.length === 0) return;

      // Messages in API v2 are returned newest first. Reverse so we process oldest to newest.
      const chronological = [...messages].reverse();
      for (const msg of chronological) {
        this.processChatMessage(msg, 'POLL');
      }
    } catch (err: any) {
      // Non-blocking catch to prevent poll log clutter
    }
  }

  /**
   * Normalizes and records a chat message from WebSocket or Polling
   */
  public processChatMessage(payload: any, source: 'WEBSOCKET' | 'POLL' | 'WEBHOOK' = 'WEBSOCKET') {
    if (!payload) return;

    try {
      const sender = payload.sender || payload.chatter || payload.user || {};
      const senderId = String(sender.id || payload.user_id || payload.sender_id || 'unknown');
      const username = sender.username || sender.slug || sender.name || 'Chatter';
      const content = payload.content || payload.message || '';
      const createdAt = payload.created_at || new Date().toISOString();
      const messageId = payload.id ? String(payload.id) : undefined;

      if (!content || senderId === 'unknown') return;

      const existingUser = db.getKickUserById(senderId);
      const seed = username || senderId || 'chatter';
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      const defaultIdx = (Math.abs(hash) % 8) + 1;
      const kickDefaultAvatar = `https://kick.com/img/default-profile-pictures/default-avatar-${defaultIdx}.webp`;

      const avatarUrl = sender.profile_pic || 
        sender.profile_picture || 
        (existingUser?.avatarUrl && !existingUser.avatarUrl.includes('default-medium.webp') ? existingUser.avatarUrl : null) ||
        kickDefaultAvatar;

      // Asynchronously fetch real Kick avatar if user doesn't have custom picture yet
      if (!existingUser || !existingUser.avatarUrl || existingUser.avatarUrl.includes('default-avatar') || existingUser.avatarUrl.includes('bottts')) {
        kickService.fetchKickUserAvatar(username, senderId).then(realAv => {
          if (realAv) {
            db.updateUserAvatar(senderId, realAv);
          }
        }).catch(() => {});
      }

      const latestStream = db.getStreams(1, 0).streams[0];
      const activeStreamId = db.getActiveStreamId() || latestStream?.streamId || '125836373';
      const streamTitle = db.getStreamById(activeStreamId)?.title || db.getChannel().currentStreamTitle || 'Kick Broadcast';

      // Check if message is already recorded in database
      const existingMessages = db.getRawData().chatMessages;
      const isAlreadySaved = messageId 
        ? existingMessages.some(m => m.messageId === messageId)
        : existingMessages.some(m => m.kickUserId === senderId && m.content === content && Math.abs(new Date(m.timestamp).getTime() - new Date(createdAt).getTime()) < 5000);

      const savedMsg = db.addChatMessage({
        messageId,
        kickUserId: senderId,
        username,
        avatarUrl,
        streamId: activeStreamId,
        streamTitle,
        content,
        timestamp: createdAt
      });

      if (!isAlreadySaved) {
        this.totalTrackedThisSession += 1;
        this.lastMessageAt = createdAt;
        console.log(`[Tracker] [${source}] Recorded chat from ${username} (${senderId}): "${content.slice(0, 35)}..." (+1 pt)`);
        db.addSystemLog('info', 'CHAT_TRACKER', `[${source}] Recorded chat from @${username}: "${content.slice(0, 40)}" (+1 pt)`);
      }
    } catch (err: any) {
      console.error('[Tracker] Error processing chat message:', err.message);
    }
  }

  /**
   * Processes a subscription event
   */
  public processSubscriptionEvent(payload: any) {
    try {
      const subscriber = payload.subscriber || payload.user || {};
      const subId = String(payload.user_id || subscriber.id || payload.subscriber_id || payload.username || `sub_${Date.now()}`);
      const subName = payload.username || subscriber.username || payload.subscriber_username || 'Subscriber';
      const existingUser = db.getKickUserById(subId);
      const avatarUrl = subscriber.profile_pic || 
        payload.profile_pic || 
        (existingUser?.avatarUrl && !existingUser.avatarUrl.includes('default-medium.webp') ? existingUser.avatarUrl : null) ||
        `https://kick.com/img/default-profile-pictures/default-avatar-1.webp`;

      db.addPoints(subId, subName, avatarUrl, 'SUBSCRIPTION');
      console.log(`[Tracker] Live subscription from ${subName} (+100 pts)`);
      db.addSystemLog('success', 'TRACKER', `Real-time subscription tracked from ${subName} (+100 pts)`);
    } catch (err: any) {
      console.error('[Tracker] Error processing subscription:', err.message);
    }
  }

  /**
   * Processes gifted subscriptions event
   */
  public processGiftedSubscriptionEvent(payload: any) {
    try {
      const gifter = payload.gifter || payload.user || {};
      const gifterId = String(payload.gifter_id || payload.gifter_user_id || gifter.id || payload.user_id || payload.gifter_username || 'unknown');
      const gifterName = payload.gifter_username || gifter.username || payload.username || 'Gifter';
      const existingUser = db.getKickUserById(gifterId);
      const avatarUrl = gifter.profile_pic || 
        payload.profile_pic || 
        (existingUser?.avatarUrl && !existingUser.avatarUrl.includes('default-medium.webp') ? existingUser.avatarUrl : null) ||
        `https://kick.com/img/default-profile-pictures/default-avatar-1.webp`;
      
      const count = Array.isArray(payload.gifted_usernames)
        ? payload.gifted_usernames.length
        : Number(payload.gift_count || payload.count || 1);

      if (gifterId !== 'unknown') {
        for (let i = 0; i < count; i++) {
          db.addPoints(gifterId, gifterName, avatarUrl, 'GIFT_SUBSCRIPTION');
        }
        console.log(`[Tracker] Live gift subs: ${count} from ${gifterName} (+${count * 100} pts)`);
        db.addSystemLog('success', 'TRACKER', `Tracked ${count} Gift Sub(s) from ${gifterName} (+${count * 100} pts)`);
      }
    } catch (err: any) {
      console.error('[Tracker] Error processing gift subs:', err.message);
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      wsStatus: this.wsStatus,
      channelSlug: this.channelSlug,
      channelId: this.channelId,
      chatroomId: this.chatroomId,
      broadcasterUserId: this.broadcasterUserId,
      totalTrackedThisSession: this.totalTrackedThisSession,
      lastMessageAt: this.lastMessageAt,
      lastCheck: this.lastCheckAt,
      activeSeason: db.getActiveSeason().seasonId
    };
  }
}

export const trackerService = new TrackerService();
