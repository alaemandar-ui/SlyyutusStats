import React, { useState, useEffect } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { Terminal, Key, ShieldCheck, RefreshCw, AlertCircle, Check, HelpCircle } from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

interface CipherChallenge {
  ciphertext: string;
  plaintext: string;
  shift: number;
  hint: string;
  source: string;
}

const CIPHER_POOL: Array<{ phrase: string; source: string; hint: string }> = [
  {
    phrase: "REACTOR CORE BYPASS ENGAGED",
    source: "Apex Terminal 09",
    hint: "Caesar key rotation by 3 characters (A becomes D)."
  },
  {
    phrase: "QUANTUM TRANSMISSION INTERCEPTED",
    source: "Syndicate Sat-Com",
    hint: "Caesar key rotation by 4 characters (A becomes E)."
  },
  {
    phrase: "EXTRACTION TEAM ARRIVING AT DOCK",
    source: "Infiltration Node B",
    hint: "Caesar key rotation by 5 characters (A becomes F)."
  },
  {
    phrase: "FIREWALL SECURITY PROTOCOL BREACHED",
    source: "Mainframe Citadel",
    hint: "Caesar key rotation by 2 characters (A becomes C)."
  },
  {
    phrase: "DEPLOY SATELLITE OVERWRITE CODE",
    source: "Orbital Command",
    hint: "Caesar key rotation by 6 characters (A becomes G)."
  }
];

export const CipherPuzzleGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [challenge, setChallenge] = useState<CipherChallenge | null>(null);
  const [userShift, setUserShift] = useState<number>(0);
  const [decodedPreview, setDecodedPreview] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const timeLimit = difficulty === 'expert' ? 90 : difficulty === 'hard' ? 100 : difficulty === 'medium' ? 120 : 150;

  useEffect(() => {
    generateChallenge();
  }, [difficulty]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinish({
            gameId: 'cipher_puzzle',
            gameTitle: 'Cipher Decoder',
            score: 0,
            timeSeconds: timeLimit,
            accuracy: 0,
            difficulty,
            gameMode: 'Standard',
            success: false
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit]);

  const generateChallenge = () => {
    const base = CIPHER_POOL[Math.floor(Math.random() * CIPHER_POOL.length)];
    const shift = Math.floor(Math.random() * 5) + 2; // shift 2 to 6

    // Encrypt
    const ciphertext = base.phrase
      .split('')
      .map(char => {
        if (char >= 'A' && char <= 'Z') {
          const code = char.charCodeAt(0) - 65;
          const shifted = (code + shift) % 26;
          return String.fromCharCode(shifted + 65);
        }
        return char;
      })
      .join('');

    setChallenge({
      ciphertext,
      plaintext: base.phrase,
      shift,
      hint: base.hint,
      source: base.source
    });

    setUserShift(0);
    setDecodedPreview(ciphertext);
    setTimeLeft(timeLimit);
    setShowHint(false);
    setFeedback(null);
    setStartTime(Date.now());
  };

  // Re-compute decoded preview whenever user changes shift
  useEffect(() => {
    if (!challenge) return;
    const decoded = challenge.ciphertext
      .split('')
      .map(char => {
        if (char >= 'A' && char <= 'Z') {
          const code = char.charCodeAt(0) - 65;
          const unshifted = (code - userShift + 26) % 26;
          return String.fromCharCode(unshifted + 65);
        }
        return char;
      })
      .join('');

    setDecodedPreview(decoded);
  }, [userShift, challenge]);

  const handleVerify = () => {
    if (!challenge) return;

    if (userShift === challenge.shift) {
      const timeSpent = Math.max(1, timeLimit - timeLeft);
      const diffMult = difficulty === 'expert' ? 3.0 : difficulty === 'hard' ? 2.3 : difficulty === 'medium' ? 1.7 : 1.2;
      const hintPenalty = showHint ? 150 : 0;
      const baseScore = 600;
      const timeBonus = timeLeft * 6;
      const finalScore = Math.max(100, Math.round((baseScore + timeBonus - hintPenalty) * diffMult));

      onFinish({
        gameId: 'cipher_puzzle',
        gameTitle: 'Cipher Decoder',
        score: finalScore,
        timeSeconds: timeSpent,
        accuracy: 100,
        difficulty,
        gameMode: 'Standard',
        success: true
      });
    } else {
      setFeedback('Decryption key invalid. The decoded stream remains scrambled.');
    }
  };

  if (!challenge) return null;

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 relative overflow-hidden text-white shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Cipher Decoder
              <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Decrypt intercepted telemetry before mainframe transmission window locks</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936]">
            <span className="text-xs text-gray-400">Lockout in:</span>
            <span className={`text-lg font-mono font-bold ${timeLeft < 20 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {timeLeft}s
            </span>
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            Exit Game
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Terminal Display */}
      <div className="bg-[#0b0e14] border border-[#1e2533] rounded-xl p-6 mb-6 font-mono">
        <div className="flex items-center justify-between text-xs text-gray-500 border-b border-[#1e2533] pb-3 mb-4">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            SOURCE: {challenge.source}
          </span>
          <span>PROTOCOL: CIPHER-X26</span>
        </div>

        {/* Encrypted Raw */}
        <div className="mb-4">
          <span className="text-[11px] text-gray-400 block mb-1">INTERCEPTED CIPHERTEXT:</span>
          <p className="text-lg md:text-xl text-red-400 tracking-wider font-bold bg-[#141923] p-3 rounded-lg border border-red-500/20 break-words">
            {challenge.ciphertext}
          </p>
        </div>

        {/* Decoded Stream Preview */}
        <div>
          <span className="text-[11px] text-gray-400 block mb-1">DECRYPTED STREAM BUFFER:</span>
          <p className="text-lg md:text-xl text-emerald-400 tracking-wider font-bold bg-[#141923] p-3 rounded-lg border border-emerald-500/30 break-words">
            {decodedPreview}
          </p>
        </div>
      </div>

      {/* Calibration Controls */}
      <div className="bg-[#121720] border border-[#232936] rounded-xl p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              Cryptographic Shift Calibration
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Rotate the cipher key wheel until the stream clarifies into intelligible language</p>
          </div>

          <button
            onClick={() => setShowHint(true)}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showHint ? 'Hint Revealed' : 'Reveal Security Intel (-150 pts)'}
          </button>
        </div>

        {showHint && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <strong>Decryption Hint:</strong> {challenge.hint}
          </div>
        )}

        {/* Slider Key Selector */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 font-mono">Shift 0</span>
          <input
            type="range"
            min={0}
            max={25}
            value={userShift}
            onChange={(e) => setUserShift(parseInt(e.target.value))}
            className="flex-1 accent-emerald-400 h-2 bg-[#1a212e] rounded-lg cursor-pointer"
          />
          <span className="text-xs text-gray-400 font-mono">Shift 25</span>
          <div className="w-16 text-center font-mono font-bold text-lg bg-[#161c26] border border-[#232936] rounded-lg py-1 text-emerald-400">
            +{userShift}
          </div>
        </div>

        {/* Quick Stepper Buttons */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[...Array(10)].map((_, i) => (
            <button
              key={i}
              onClick={() => setUserShift(i)}
              className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-colors ${
                userShift === i
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : 'bg-[#161c26] hover:bg-[#202735] text-gray-300 border border-[#232936]'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Submission */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={handleVerify}
          className="px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          Authenticate Decryption
        </button>
      </div>
    </div>
  );
};
