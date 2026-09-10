import React, { useState, useEffect, useRef } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { HelpCircle, Clock, Zap, CheckCircle2, XCircle, Trophy, Sparkles, AlertTriangle } from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

const QUIZ_BANK: QuizQuestion[] = [
  // Science
  {
    id: 'sci_1',
    category: 'Science',
    question: 'Which chemical element has the highest melting point of all non-alloyed metals?',
    options: ['Tungsten (Wolfram)', 'Osmium', 'Titanium', 'Platinum'],
    correct: 0,
    explanation: 'Tungsten has the highest melting point of any metal at approximately 3,422 °C (6,192 °F).',
    difficulty: 'hard'
  },
  {
    id: 'sci_2',
    category: 'Science',
    question: 'What fundamental particle mediates the electromagnetic force in quantum field theory?',
    options: ['Photon', 'Gluon', 'Z Boson', 'Graviton'],
    correct: 0,
    explanation: 'Photons are the gauge bosons responsible for mediating the electromagnetic interaction.',
    difficulty: 'medium'
  },
  // Space
  {
    id: 'spc_1',
    category: 'Space',
    question: 'What is the name of the supermassive black hole located at the gravitational center of the Milky Way galaxy?',
    options: ['Sagittarius A*', 'Cygnus X-1', 'Messier 87*', 'Centaurus A'],
    correct: 0,
    explanation: 'Sagittarius A* is the supermassive black hole at our galactic core, roughly 4 million solar masses.',
    difficulty: 'medium'
  },
  {
    id: 'spc_2',
    category: 'Space',
    question: 'Which moon in our solar system boasts a dense, nitrogen-rich atmosphere with liquid methane lakes and rivers?',
    options: ['Titan (Saturn)', 'Europa (Jupiter)', 'Triton (Neptune)', 'Enceladus (Saturn)'],
    correct: 0,
    explanation: 'Saturn\'s largest moon Titan is the only celestial body other than Earth known to have stable surface liquids.',
    difficulty: 'hard'
  },
  // Geography
  {
    id: 'geo_1',
    category: 'Geography',
    question: 'What is the deepest point in Earth’s oceans, descending nearly 11,000 meters beneath sea level?',
    options: ['Challenger Deep (Mariana Trench)', 'Puerto Rico Trench', 'Java Trench', 'Molloy Deep'],
    correct: 0,
    explanation: 'Challenger Deep is the deepest known point on Earth, situated in the southern Mariana Trench.',
    difficulty: 'easy'
  },
  {
    id: 'geo_2',
    category: 'Geography',
    question: 'Which country in the world spans the highest number of sovereign time zones, including overseas territories?',
    options: ['France (12 time zones)', 'Russia (11 time zones)', 'United States (11 time zones)', 'United Kingdom (9 time zones)'],
    correct: 0,
    explanation: 'France spans 12 different time zones across its mainland and numerous overseas departments and territories.',
    difficulty: 'expert'
  },
  // History
  {
    id: 'hist_1',
    category: 'History',
    question: 'In which ancient Mesopotamian city did the historical King Hammurabi codify one of humanity’s earliest written legal sets?',
    options: ['Babylon', 'Nineveh', 'Ur', 'Persepolis'],
    correct: 0,
    explanation: 'The Code of Hammurabi was enacted in Babylon circa 1750 BCE.',
    difficulty: 'medium'
  },
  {
    id: 'hist_2',
    category: 'History',
    question: 'The decisive 1453 Siege that brought about the fall of the Byzantine Empire was commanded by which Ottoman Sultan?',
    options: ['Mehmed II (The Conqueror)', 'Suleiman the Magnificent', 'Selim I', 'Bayezid I'],
    correct: 0,
    explanation: 'Sultan Mehmed II conquered Constantinople in 1453 at just 21 years of age.',
    difficulty: 'hard'
  },
  // Technology
  {
    id: 'tech_1',
    category: 'Technology',
    question: 'What mathematical consensus algorithm forms the cryptographic basis of the original Bitcoin blockchain network?',
    options: ['SHA-256 Proof-of-Work', 'Scrypt Delegated-Stake', 'BLAKE2b Byzantine-Fault', 'Keccak-256 DAG'],
    correct: 0,
    explanation: 'Bitcoin uses Hashcash SHA-256 Proof-of-Work to secure block generation and mining consensus.',
    difficulty: 'hard'
  },
  {
    id: 'tech_2',
    category: 'Technology',
    question: 'Who formulated the fundamental Information Theory theorem establishing channel capacity and entropy in 1948?',
    options: ['Claude Shannon', 'Alan Turing', 'John von Neumann', 'Norbert Wiener'],
    correct: 0,
    explanation: 'Claude Shannon published "A Mathematical Theory of Communication", founding digital information theory.',
    difficulty: 'expert'
  },
  // Mathematics & Logic
  {
    id: 'math_1',
    category: 'Mathematics',
    question: 'What is the only even prime number in standard arithmetic?',
    options: ['2', '0', '4', 'There are none'],
    correct: 0,
    explanation: '2 is the only even prime number because all greater even integers are divisible by 2.',
    difficulty: 'easy'
  },
  {
    id: 'math_2',
    category: 'Mathematics',
    question: 'Which unsolved Millennium Prize Problem asks whether every algorithmic problem whose solution can be quickly verified can also be quickly solved?',
    options: ['P vs NP Problem', 'Riemann Hypothesis', 'Navier–Stokes Existence', 'Birch and Swinnerton-Dyer'],
    correct: 0,
    explanation: 'The P versus NP problem is one of the most prominent unsolved mathematical and computational enigmas.',
    difficulty: 'expert'
  },
  // World Records & Nature
  {
    id: 'nat_1',
    category: 'Nature',
    question: 'Which living organism is recognized as the fastest animal on Earth when executing high-speed hunting dives?',
    options: ['Peregrine Falcon (over 380 km/h)', 'Cheetah (120 km/h)', 'Sailfish (110 km/h)', 'Golden Eagle (320 km/h)'],
    correct: 0,
    explanation: 'The Peregrine Falcon reaches recorded terminal stoop velocities surpassing 389 km/h (242 mph).',
    difficulty: 'medium'
  },
  {
    id: 'nat_2',
    category: 'World Records',
    question: 'The Mariana Snailfish holds the world record as the deepest living vertebrate ever recorded, observed at depths exceeding:',
    options: ['8,100 meters', '4,200 meters', '6,000 meters', '10,900 meters'],
    correct: 0,
    explanation: 'Pseudoliparis swirei thrives under colossal hydrostatic pressure at depths exceeding 8,100 meters.',
    difficulty: 'expert'
  },
  // Video Games & Entertainment
  {
    id: 'vg_1',
    category: 'Video Games',
    question: 'In competitive gaming history, which legendary real-time strategy tournament game catalyzed the genesis of modern South Korean esports in 1998?',
    options: ['StarCraft: Brood War', 'Warcraft III', 'Command & Conquer', 'Age of Empires II'],
    correct: 0,
    explanation: 'StarCraft: Brood War laid the structural foundation of modern televised professional esports.',
    difficulty: 'medium'
  },
  {
    id: 'mov_1',
    category: 'Movies & Entertainment',
    question: 'Which landmark 1927 Fritz Lang sci-fi cinematic masterpiece pioneered the visual archetype of dystopian art-deco cyberpunk megacities?',
    options: ['Metropolis', 'Nosferatu', 'The Cabinet of Dr. Caligari', 'Solaris'],
    correct: 0,
    explanation: 'Fritz Lang\'s Metropolis pioneered cinematic futuristic architecture, androids, and cyberpunk aesthetics.',
    difficulty: 'hard'
  },
  // Sports
  {
    id: 'spo_1',
    category: 'Sports',
    question: 'In standard international association football (FIFA), how many yards away from the goal line is the penalty kick spot positioned?',
    options: ['12 yards (11 meters)', '10 yards', '14 yards', '16 yards'],
    correct: 0,
    explanation: 'The penalty mark is located exactly 12 yards (10.97 m) from the center point between the goalposts.',
    difficulty: 'easy'
  }
];

export const DifficultQuizGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(15);
  const [answersRecord, setAnswersRecord] = useState<boolean[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());

  const totalQuestions = 7;
  const questionSeconds = difficulty === 'expert' ? 10 : difficulty === 'hard' ? 12 : difficulty === 'medium' ? 15 : 18;

  useEffect(() => {
    initQuiz();
  }, [difficulty]);

  useEffect(() => {
    if (feedback !== null) return;

    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswerSelect(-1, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, feedback]);

  const initQuiz = () => {
    // Filter and shuffle
    const shuffled = [...QUIZ_BANK]
      .sort(() => Math.random() - 0.5)
      .slice(0, totalQuestions)
      .map(q => {
        // Randomize options order
        const correctOpt = q.options[q.correct];
        const shuffledOpts = [...q.options].sort(() => Math.random() - 0.5);
        const newCorrectIdx = shuffledOpts.indexOf(correctOpt);
        return {
          ...q,
          options: shuffledOpts,
          correct: newCorrectIdx
        };
      });

    setQuestions(shuffled);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedIdx(null);
    setFeedback(null);
    setAnswersRecord([]);
    setQuestionTimeLeft(questionSeconds);
    setGameStartTime(Date.now());
  };

  const handleAnswerSelect = (optionIdx: number, isTimeout: boolean = false) => {
    if (feedback !== null) return;

    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    setSelectedIdx(optionIdx);

    if (isTimeout) {
      setFeedback('timeout');
      setStreak(0);
      setAnswersRecord(prev => [...prev, false]);
    } else {
      const isCorrect = optionIdx === currentQ.correct;
      const newRecord = [...answersRecord, isCorrect];
      setAnswersRecord(newRecord);

      if (isCorrect) {
        setFeedback('correct');
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > maxStreak) setMaxStreak(newStreak);

        // Score formulation: speed multiplier + streak bonus + difficulty multiplier
        const speedBonus = questionTimeLeft * 12;
        const streakBonus = newStreak * 40;
        const basePts = 250;
        const diffMult = difficulty === 'expert' ? 2.5 : difficulty === 'hard' ? 2.0 : difficulty === 'medium' ? 1.5 : 1.0;
        const pts = Math.round((basePts + speedBonus + streakBonus) * diffMult);
        setScore(prev => prev + pts);
      } else {
        setFeedback('wrong');
        setStreak(0);
        // Penalty for wrong answer on hard/expert
        if (difficulty === 'hard' || difficulty === 'expert') {
          setScore(prev => Math.max(0, prev - 75));
        }
      }
    }

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(prev => prev + 1);
        setSelectedIdx(null);
        setFeedback(null);
        setQuestionTimeLeft(questionSeconds);
      } else {
        finishQuiz();
      }
    }, 2000);
  };

  const finishQuiz = () => {
    const correctCount = answersRecord.filter(Boolean).length;
    const accuracy = Math.round((correctCount / questions.length) * 100);
    const totalTime = Math.max(1, Math.round((Date.now() - gameStartTime) / 1000));
    const isSuccess = correctCount >= Math.ceil(questions.length * 0.5);

    onFinish({
      gameId: 'difficult_quiz',
      gameTitle: 'Apex Intellect Trivia',
      score,
      timeSeconds: totalTime,
      accuracy,
      difficulty,
      gameMode: 'Standard',
      success: isSuccess
    });
  };

  const current = questions[currentIdx];
  if (!current) return null;

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 relative overflow-hidden text-white shadow-2xl">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Apex Intellect Trivia
              <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Broad high-difficulty global knowledge quiz across 13 disciplines</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936]">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className={`text-lg font-mono font-bold ${questionTimeLeft < 5 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
              {questionTimeLeft}s
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936]">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">{streak}x Streak</span>
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* Progress & Category Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Question {currentIdx + 1} of {questions.length}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[#1e2533] text-gray-300 border border-[#2d374d]">
            {current.category}
          </span>
        </div>
        <div className="font-mono text-amber-300 font-bold text-sm">
          {score} pts
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-1.5 bg-[#161c26] rounded-full overflow-hidden flex gap-1 mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`flex-1 transition-all ${
              i < currentIdx
                ? answersRecord[i] ? 'bg-[#00ff88]' : 'bg-red-500'
                : i === currentIdx
                ? 'bg-amber-400 animate-pulse'
                : 'bg-[#232936]'
            }`}
          />
        ))}
      </div>

      {/* Question Card */}
      <div className="bg-[#121720] border border-[#232936] rounded-xl p-6 md:p-8 mb-6">
        <h3 className="text-lg md:text-xl font-bold text-white leading-snug mb-2">
          {current.question}
        </h3>
        <p className="text-xs text-gray-500">Fast answers generate speed multipliers; consecutive answers generate streak bonuses</p>

        {feedback && (
          <div className={`mt-4 p-3 rounded-xl border text-xs leading-relaxed animate-fade-in ${
            feedback === 'correct'
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <p className="font-bold flex items-center gap-1.5 mb-1">
              {feedback === 'correct' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
              {feedback === 'correct' ? 'Confirmed!' : feedback === 'timeout' ? 'Time Expired!' : 'Incorrect Answer'}
            </p>
            <p className="text-gray-300">{current.explanation}</p>
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {current.options.map((opt, optIdx) => {
          let btnStyle = 'bg-[#161c26] hover:bg-[#1e2634] border-[#232936] text-gray-200';
          if (feedback !== null) {
            if (optIdx === current.correct) {
              btnStyle = 'bg-green-500/20 border-green-500/60 text-green-300 font-bold';
            } else if (selectedIdx === optIdx) {
              btnStyle = 'bg-red-500/20 border-red-500/60 text-red-300';
            } else {
              btnStyle = 'bg-[#121720] border-[#232936] text-gray-500 opacity-40';
            }
          }

          return (
            <button
              key={optIdx}
              disabled={feedback !== null}
              onClick={() => handleAnswerSelect(optIdx)}
              className={`p-4 rounded-xl border text-left font-medium text-sm transition-all shadow-md flex items-center justify-between active:scale-98 ${btnStyle}`}
            >
              <span>{opt}</span>
              <span className="w-6 h-6 rounded-lg bg-[#0e1217] flex items-center justify-center text-xs text-gray-400 font-mono ml-3 shrink-0">
                {String.fromCharCode(65 + optIdx)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
