import React, { useState, useEffect } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { Binary, CheckCircle2, XCircle, Clock, Zap, RotateCcw, Award } from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

interface PatternRound {
  sequence: string[];
  missingIndex: number;
  options: string[];
  correctAnswer: string;
  ruleExplanation: string;
}

export const PatternDecoderGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [rounds, setRounds] = useState<PatternRound[]>([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(20);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [answersLog, setAnswersLog] = useState<boolean[]>([]);

  const totalRounds = 5;

  const roundDuration = difficulty === 'expert' ? 14 : difficulty === 'hard' ? 18 : difficulty === 'medium' ? 24 : 30;

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  useEffect(() => {
    if (gameOver || feedback !== null) return;

    const timer = setInterval(() => {
      setRoundTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRoundIdx, feedback, gameOver]);

  const generatePatternPool = (): PatternRound[] => {
    const pool: PatternRound[] = [];

    // Pattern 1: Interwoven Alternating sequence (e.g. +3, x2)
    const base = Math.floor(Math.random() * 5) + 2;
    const a1 = base;
    const a2 = base * 2;
    const a3 = a1 + 3;
    const a4 = a2 * 2;
    const a5 = a3 + 3;
    const a6 = a4 * 2;
    pool.push({
      sequence: [String(a1), String(a2), String(a3), String(a4), String(a5), '?'],
      missingIndex: 5,
      correctAnswer: String(a6),
      options: [String(a6), String(a6 + 2), String(a6 - 4), String(a5 * 2)].sort(() => Math.random() - 0.5),
      ruleExplanation: 'Interwoven series: odd indices add 3, even indices double.'
    });

    // Pattern 2: Difference of squares or cubics
    const shift = Math.floor(Math.random() * 3) + 1;
    const s1 = (1 + shift) ** 2;
    const s2 = (2 + shift) ** 2;
    const s3 = (3 + shift) ** 2;
    const s4 = (4 + shift) ** 2;
    const s5 = (5 + shift) ** 2;
    pool.push({
      sequence: [String(s1), String(s2), '?', String(s4), String(s5)],
      missingIndex: 2,
      correctAnswer: String(s3),
      options: [String(s3), String(s3 + 5), String(s3 - 6), String(s2 + 9)].sort(() => Math.random() - 0.5),
      ruleExplanation: `Sequential squares: (${1 + shift})², (${2 + shift})², (${3 + shift})²...`
    });

    // Pattern 3: Fibonacci Variant (a_n = a_{n-1} + a_{n-2} + k)
    const k = difficulty === 'hard' || difficulty === 'expert' ? 2 : 1;
    const f1 = 2;
    const f2 = 3;
    const f3 = f1 + f2 + k;
    const f4 = f2 + f3 + k;
    const f5 = f3 + f4 + k;
    const f6 = f4 + f5 + k;
    pool.push({
      sequence: [String(f1), String(f2), String(f3), String(f4), '?', String(f6)],
      missingIndex: 4,
      correctAnswer: String(f5),
      options: [String(f5), String(f5 + 3), String(f5 - 4), String(f4 + 10)].sort(() => Math.random() - 0.5),
      ruleExplanation: `Recursive sum plus constant: x_n = x_{n-1} + x_{n-2} + ${k}.`
    });

    // Pattern 4: Modular Hex / Alphanumeric Step
    const chars = ['A', 'D', 'G', 'J', 'M', 'P', 'S', 'V', 'Y'];
    const startCharIdx = Math.floor(Math.random() * 3);
    const alphaSeq = [chars[startCharIdx], chars[startCharIdx + 1], chars[startCharIdx + 2], '?', chars[startCharIdx + 4]];
    const correctChar = chars[startCharIdx + 3];
    const wrongChars = ['K', 'N', 'L', 'O'].filter(c => c !== correctChar).slice(0, 3);
    pool.push({
      sequence: alphaSeq,
      missingIndex: 3,
      correctAnswer: correctChar,
      options: [correctChar, ...wrongChars].sort(() => Math.random() - 0.5),
      ruleExplanation: 'Alphabetical jump: advancing +3 letters each step.'
    });

    // Pattern 5: Multiplier minus decrement (e.g. x2 - 1, x2 - 2, x2 - 3)
    const m1 = 3;
    const m2 = m1 * 2 - 1; // 5
    const m3 = m2 * 2 - 2; // 8
    const m4 = m3 * 2 - 3; // 13
    const m5 = m4 * 2 - 4; // 22
    pool.push({
      sequence: [String(m1), String(m2), String(m3), String(m4), '?'],
      missingIndex: 4,
      correctAnswer: String(m5),
      options: [String(m5), String(m5 + 2), String(m5 - 3), String(m4 * 2)].sort(() => Math.random() - 0.5),
      ruleExplanation: 'Progressive transformation: Multiply by 2 then subtract incrementing offset.'
    });

    return pool.sort(() => Math.random() - 0.5).slice(0, totalRounds);
  };

  const startNewGame = () => {
    const generated = generatePatternPool();
    setRounds(generated);
    setCurrentRoundIdx(0);
    setScore(0);
    setStreak(0);
    setSelectedOption(null);
    setFeedback(null);
    setGameOver(false);
    setAnswersLog([]);
    setRoundTimeLeft(roundDuration);
    setStartTime(Date.now());
  };

  const handleTimeout = () => {
    handleAnswerSubmission(null);
  };

  const handleSelect = (option: string) => {
    if (feedback !== null || gameOver) return;
    setSelectedOption(option);
    handleAnswerSubmission(option);
  };

  const handleAnswerSubmission = (chosen: string | null) => {
    const current = rounds[currentRoundIdx];
    if (!current) return;

    const isCorrect = chosen === current.correctAnswer;
    const newAnswers = [...answersLog, isCorrect];
    setAnswersLog(newAnswers);

    if (isCorrect) {
      setFeedback('correct');
      const timeBonus = roundTimeLeft * 15;
      const streakBonus = streak * 50;
      const basePoints = 200;
      const diffMult = difficulty === 'expert' ? 2.5 : difficulty === 'hard' ? 2.0 : difficulty === 'medium' ? 1.5 : 1.0;
      const roundEarned = Math.round((basePoints + timeBonus + streakBonus) * diffMult);
      setScore(prev => prev + roundEarned);
      setStreak(prev => prev + 1);
    } else {
      setFeedback('wrong');
      setStreak(0);
    }

    setTimeout(() => {
      if (currentRoundIdx + 1 < rounds.length) {
        setCurrentRoundIdx(prev => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
        setRoundTimeLeft(roundDuration);
      } else {
        // Game completed
        finishGame(newAnswers);
      }
    }, 1800);
  };

  const finishGame = (finalAnswers: boolean[]) => {
    setGameOver(true);
    const correctCount = finalAnswers.filter(Boolean).length;
    const totalTime = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const accuracy = Math.round((correctCount / rounds.length) * 100);
    const isSuccess = correctCount >= 3;

    onFinish({
      gameId: 'pattern_decoder',
      gameTitle: 'Pattern Decoder',
      score,
      timeSeconds: totalTime,
      accuracy,
      difficulty,
      gameMode: 'Standard',
      success: isSuccess
    });
  };

  const current = rounds[currentRoundIdx];

  if (!current) return null;

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 relative overflow-hidden text-white shadow-2xl">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Pattern Decoder
              <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Determine the missing element in complex algorithmic sequences</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936]">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className={`text-lg font-mono font-bold ${roundTimeLeft < 6 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
              {roundTimeLeft}s
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936]">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300">{streak}x Streak</span>
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* Round & Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Pattern {currentRoundIdx + 1} of {rounds.length}</span>
          <span className="font-mono text-cyan-300 font-bold">{score} pts</span>
        </div>
        <div className="w-full h-1.5 bg-[#161c26] rounded-full overflow-hidden flex gap-1">
          {rounds.map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-all ${
                i < currentRoundIdx
                  ? answersLog[i] ? 'bg-[#00ff88]' : 'bg-red-500'
                  : i === currentRoundIdx
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-[#232936]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Pattern Stage */}
      <div className="bg-[#121720] border border-[#232936] rounded-xl p-8 mb-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 my-6">
          {current.sequence.map((item, idx) => (
            <div
              key={idx}
              className={`min-w-[56px] md:min-w-[72px] h-16 md:h-20 rounded-2xl flex items-center justify-center font-mono text-xl md:text-2xl font-bold border transition-all ${
                item === '?'
                  ? 'bg-cyan-500/10 border-cyan-400/60 text-cyan-300 shadow-lg shadow-cyan-500/20 animate-pulse scale-105'
                  : 'bg-[#161c26] border-[#2b3547] text-white shadow-md'
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {feedback && (
          <div className={`mt-4 p-3 rounded-xl border text-xs max-w-md mx-auto animate-fade-in ${
            feedback === 'correct' 
              ? 'bg-green-500/10 border-green-500/30 text-green-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <p className="font-bold mb-1 flex items-center justify-center gap-1.5">
              {feedback === 'correct' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {feedback === 'correct' ? 'Correct Deduction!' : `Incorrect! The answer was ${current.correctAnswer}`}
            </p>
            <p className="text-gray-400">{current.ruleExplanation}</p>
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {current.options.map((opt) => {
          let btnStyle = 'bg-[#161c26] hover:bg-[#1e2634] border-[#232936] text-white';
          if (feedback !== null) {
            if (opt === current.correctAnswer) {
              btnStyle = 'bg-green-500/20 border-green-500/60 text-green-300 font-bold';
            } else if (selectedOption === opt) {
              btnStyle = 'bg-red-500/20 border-red-500/60 text-red-300';
            } else {
              btnStyle = 'bg-[#121720] border-[#232936] text-gray-500 opacity-50';
            }
          }

          return (
            <button
              key={opt}
              disabled={feedback !== null}
              onClick={() => handleSelect(opt)}
              className={`p-4 rounded-xl border font-mono text-lg font-bold transition-all shadow-md active:scale-95 ${btnStyle}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
