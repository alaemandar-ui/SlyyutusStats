import { db } from './db.js';

export class LeagueEngine {
  /**
   * Award verified activity points to a Kick user
   */
  public static awardPoints(
    kickUserId: string,
    username: string,
    avatarUrl: string,
    type: 'CHAT_MESSAGE' | 'SUBSCRIPTION' | 'GIFT_SUBSCRIPTION',
    customPoints?: number
  ) {
    const result = db.addPoints(kickUserId, username, avatarUrl, type, customPoints);
    return result;
  }

  /**
   * Finalize a season, freeze its final rankings, and award permanent badges
   */
  public static finalizeSeason(seasonId: string) {
    return db.finalizeSeason(seasonId);
  }

  /**
   * Get active season or auto-initialize
   */
  public static getCurrentSeason() {
    return db.getActiveSeason();
  }

  /**
   * Check if current month changed and auto-finalize previous season if needed
   */
  public static checkMonthTransition() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const expectedCurrentSeasonId = `${mm}-${yy}`;

    const seasons = db.getSeasons();
    const activeSeasons = seasons.filter(s => s.isActive);

    for (const season of activeSeasons) {
      if (season.seasonId !== expectedCurrentSeasonId) {
        console.log(`[League Engine] Season ${season.seasonId} month passed. Finalizing...`);
        db.finalizeSeason(season.seasonId);
      }
    }

    db.getActiveSeason(); // Ensure current month exists
  }
}
