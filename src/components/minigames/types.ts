export type GameId = 
  | 'logic_grid' 
  | 'pattern_decoder' 
  | 'sequence_master' 
  | 'cipher_puzzle' 
  | 'difficult_quiz' 
  | 'precision_timing' 
  | 'multi_task' 
  | 'arcade_shooter';

export type GameCategory = 'puzzle' | 'quiz' | 'skill' | 'arcade';
export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface GameCatalogItem {
  id: GameId;
  title: string;
  category: GameCategory;
  description: string;
  badge: string;
  modes?: string[];
}

export interface GameScoreSubmission {
  gameId: GameId;
  gameTitle: string;
  score: number;
  timeSeconds: number;
  accuracy?: number;
  difficulty: GameDifficulty;
  gameMode?: string;
  success: boolean;
}

export interface PlayerStats {
  userId: string;
  totalAttempts: number;
  totalWins: number;
  winRate: number;
  bestScore: number;
  averageScore: number;
  bestCompletionTime: number;
  fastestWinTime: number;
  favoriteGame: string;
  highestPerformingGame: string;
  perGame: Record<string, {
    title: string;
    category: string;
    bestScore: number;
    fastestTime: number;
    wins: number;
    attempts: number;
    averageAccuracy: number;
  }>;
  recentActivity: Array<{
    id: string;
    gameId: string;
    gameTitle?: string;
    score: number;
    timeSeconds: number;
    accuracy?: number;
    difficulty: GameDifficulty;
    success: boolean;
    createdAt: string;
  }>;
}
