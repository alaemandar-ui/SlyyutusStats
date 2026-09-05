import { db } from './db.js';
import { kickService } from './kickService.js';
import { LeagueEngine } from './leagueEngine.js';

export class TrackerService {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Tracker] Starting Slyyutus Kick real-time tracking service...');
    db.addSystemLog('info', 'TRACKER', 'Live channel sync service started.');

    // Month rollover check
    LeagueEngine.checkMonthTransition();

    // Initial sync with Kick API, then register for live chat/sub webhook events.
    // subscribeToEvents MUST run after syncChannelStats resolves the real
    // broadcaster user id, and requires APP_URL to be a public HTTPS URL
    // (see .env) with the matching webhook URL saved in the Kick Developer Dashboard.
    kickService.syncChannelStats().then(() => {
      const broadcasterUserId = db.getChannel().userId;
      kickService.subscribeToEvents(broadcasterUserId);
    });

    // Background interval for real channel status sync (every 60 seconds)
    this.intervalId = setInterval(() => {
      kickService.syncChannelStats();
      LeagueEngine.checkMonthTransition();
    }, 60000);
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      channelSlug: 'slyyutus',
      lastCheck: new Date().toISOString(),
      activeSeason: db.getActiveSeason().seasonId
    };
  }
}

export const trackerService = new TrackerService();
