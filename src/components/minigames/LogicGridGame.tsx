import React, { useState, useEffect } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { Brain, Check, X, HelpCircle, RotateCcw, AlertCircle, ShieldAlert, Sparkles, Trophy } from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

interface LogicEntity {
  operator: string;
  sector: string;
  device: string;
}

const OPERATORS_POOL = ['Ghost', 'Valkyrie', 'Cipher', 'Phoenix', 'Ronin'];
const SECTORS_POOL = ['Sector A (Hangar)', 'Sector B (Command)', 'Sector C (Reactor)', 'Sector D (Data Core)', 'Sector E (Vault)'];
const DEVICES_POOL = ['EMP Jammer', 'Quantum Key', 'Neural Spike', 'Sonic Probe', 'Cryo Diffuser'];

export const LogicGridGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [itemsCount, setItemsCount] = useState<number>(3);
  const [operators, setOperators] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [devices, setDevices] = useState<string[]>([]);
  const [solution, setSolution] = useState<LogicEntity[]>([]);
  const [clues, setClues] = useState<string[]>([]);
  
  // User answers: operator -> { sector: string, device: string }
  const [userAssignments, setUserAssignments] = useState<Record<string, { sector: string; device: string }>>({});
  // Deduction scratchpad: key "op_sec", "op_dev", "sec_dev" -> 0 (empty), 1 (no), 2 (yes)
  const [scratchpad, setScratchpad] = useState<Record<string, number>>({});
  
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(180);
  const [gameActive, setGameActive] = useState<boolean>(true);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  useEffect(() => {
    generatePuzzle();
  }, [difficulty]);

  useEffect(() => {
    if (!gameActive) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsed(diff);
      if (diff >= maxTime) {
        setGameActive(false);
        onFinish({
          gameId: 'logic_grid',
          gameTitle: 'Neural Grid Matrix',
          score: 0,
          timeSeconds: maxTime,
          accuracy: 0,
          difficulty,
          gameMode: 'Standard',
          success: false
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameActive, startTime, maxTime]);

  const generatePuzzle = () => {
    const count = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 3 : 4;
    setItemsCount(count);
    const timeLimit = difficulty === 'easy' ? 180 : difficulty === 'medium' ? 150 : difficulty === 'hard' ? 140 : 120;
    setMaxTime(timeLimit);
    setStartTime(Date.now());
    setElapsed(0);
    setGameActive(true);
    setErrorFeedback(null);
    setScratchpad({});

    const ops = OPERATORS_POOL.slice(0, count);
    const secs = SECTORS_POOL.slice(0, count);
    const devs = DEVICES_POOL.slice(0, count);

    setOperators(ops);
    setSectors(secs);
    setDevices(devs);

    // Shuffle sectors and devices to form a unique ground truth solution
    const shuffledSecs = [...secs].sort(() => Math.random() - 0.5);
    const shuffledDevs = [...devs].sort(() => Math.random() - 0.5);

    const sol: LogicEntity[] = ops.map((op, idx) => ({
      operator: op,
      sector: shuffledSecs[idx],
      device: shuffledDevs[idx]
    }));
    setSolution(sol);

    // Initial empty user assignments
    const initialAssign: Record<string, { sector: string; device: string }> = {};
    ops.forEach(op => {
      initialAssign[op] = { sector: '', device: '' };
    });
    setUserAssignments(initialAssign);

    // Generate logical clues that directly lead to deduction
    const generatedClues: string[] = [];
    
    // Direct clues
    generatedClues.push(`Security Log: ${sol[0].operator} was confirmed carrying the ${sol[0].device}.`);
    generatedClues.push(`Telemetry: The operative deployed to ${sol[1].sector} is carrying the ${sol[1].device}.`);
    
    // Sector assignment or negative clue
    if (count >= 3) {
      generatedClues.push(`Signal intercept: ${sol[2].operator} is stationed at ${sol[2].sector}.`);
      generatedClues.push(`Exclusion rule: ${sol[1].operator} was NOT deployed to ${sol[0].sector}, nor with the ${sol[2].device}.`);
    }

    if (count >= 4) {
      generatedClues.push(`Biometric sync: ${sol[3].operator} does not possess the ${sol[0].device}.`);
      generatedClues.push(`Radar sweep: Neither ${sol[0].operator} nor ${sol[1].operator} entered ${sol[3].sector}.`);
    }

    setClues(generatedClues);
  };

  const handleToggleScratch = (key: string) => {
    setScratchpad(prev => {
      const current = prev[key] || 0;
      const next = (current + 1) % 3; // 0: none, 1: X (no), 2: check (yes)
      return { ...prev, [key]: next };
    });
  };

  const handleSelectAssignment = (operator: string, type: 'sector' | 'device', value: string) => {
    setUserAssignments(prev => ({
      ...prev,
      [operator]: {
        ...prev[operator],
        [type]: value
      }
    }));
  };

  const handleSubmit = () => {
    // Check if all filled
    for (const op of operators) {
      if (!userAssignments[op].sector || !userAssignments[op].device) {
        setErrorFeedback('Please complete all operative assignments before decrypting.');
        return;
      }
    }

    // Verify against solution
    let correctCount = 0;
    const totalChecks = operators.length * 2;

    operators.forEach(op => {
      const sol = solution.find(s => s.operator === op);
      if (sol) {
        if (sol.sector === userAssignments[op].sector) correctCount++;
        if (sol.device === userAssignments[op].device) correctCount++;
      }
    });

    const isFullSuccess = correctCount === totalChecks;
    const timeUsed = Math.max(1, elapsed);
    const accuracy = Math.round((correctCount / totalChecks) * 100);

    if (isFullSuccess) {
      setGameActive(false);
      // Calculate score
      const diffMult = difficulty === 'expert' ? 3.5 : difficulty === 'hard' ? 2.5 : difficulty === 'medium' ? 1.8 : 1.2;
      const timeBonus = Math.max(0, (maxTime - timeUsed) * 8);
      const baseScore = 600;
      const finalScore = Math.round((baseScore + timeBonus) * diffMult);

      onFinish({
        gameId: 'logic_grid',
        gameTitle: 'Neural Grid Matrix',
        score: finalScore,
        timeSeconds: timeUsed,
        accuracy: 100,
        difficulty,
        gameMode: 'Standard',
        success: true
      });
    } else {
      setErrorFeedback(`Deduction mismatch: ${correctCount} of ${totalChecks} fields were verified correctly. Check your clues!`);
    }
  };

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 relative overflow-hidden text-white shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Neural Grid Matrix
              <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Deduce the true Operative-Sector-Device assignments from verified intercepts</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936]">
            <span className="text-xs text-gray-400">Time Left:</span>
            <span className={`text-lg font-mono font-bold ${maxTime - elapsed < 30 ? 'text-red-400 animate-pulse' : 'text-[#00ff88]'}`}>
              {Math.max(0, maxTime - elapsed)}s
            </span>
          </div>

          <button
            onClick={generatePuzzle}
            className="p-2 rounded-xl bg-[#161c24] hover:bg-[#202733] text-gray-300 transition-colors border border-[#232936]"
            title="Restart puzzle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            Exit Game
          </button>
        </div>
      </div>

      {errorFeedback && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* Main Game Grid: Clues + Matrix Deduction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Intelligence Clues */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#121720] border border-[#232936] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Decrypted Clues ({clues.length})
            </h3>
            <div className="space-y-2.5">
              {clues.map((clue, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#161c26] border border-[#232936] text-xs text-gray-200 leading-relaxed flex items-start gap-2">
                  <span className="text-purple-400 font-mono font-bold mt-0.5">{idx + 1}.</span>
                  <span>{clue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Scratchpad Notes */}
          <div className="bg-[#121720] border border-[#232936] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Scratchpad (Click to mark)</h3>
              <span className="text-[10px] text-gray-500">Blank → ✗ (No) → ✓ (Yes)</span>
            </div>
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#232936] text-gray-400">
                    <th className="p-1.5 font-medium">Op / Sec</th>
                    {sectors.map(sec => (
                      <th key={sec} className="p-1 font-medium truncate max-w-[70px] text-center" title={sec}>
                        {sec.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operators.map(op => (
                    <tr key={op} className="border-b border-[#232936]/40">
                      <td className="p-1.5 font-medium text-purple-300">{op}</td>
                      {sectors.map(sec => {
                        const key = `${op}_${sec}`;
                        const state = scratchpad[key] || 0;
                        return (
                          <td key={sec} className="p-1 text-center">
                            <button
                              onClick={() => handleToggleScratch(key)}
                              className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors ${
                                state === 1 ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                                state === 2 ? 'bg-green-500/20 text-green-400 border border-green-500/40 font-bold' :
                                'bg-[#1a212d] hover:bg-[#252f3f] text-transparent'
                              }`}
                            >
                              {state === 1 ? '✗' : state === 2 ? '✓' : '·'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Final Assignment Deck */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-[#121720] border border-[#232936] rounded-xl p-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mission Deployment Matrix</h3>
                <p className="text-xs text-gray-400 mt-0.5">Assign each operative to their confirmed Sector and Tactical Device</p>
              </div>
              <span className="text-xs text-[#00ff88] bg-[#00ff88]/10 px-3 py-1 rounded-lg border border-[#00ff88]/30 font-medium">
                100% Accuracy Required
              </span>
            </div>

            <div className="space-y-4">
              {operators.map((op) => (
                <div key={op} className="p-4 rounded-xl bg-[#161c26] border border-[#232936] flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-28 shrink-0">
                    <span className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      {op}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Agent Unit</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    {/* Sector Dropdown */}
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 uppercase font-semibold">Assigned Sector</label>
                      <select
                        value={userAssignments[op]?.sector || ''}
                        onChange={(e) => handleSelectAssignment(op, 'sector', e.target.value)}
                        className="w-full bg-[#0e1217] border border-[#2a3242] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="">-- Select Sector --</option>
                        {sectors.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>

                    {/* Device Dropdown */}
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 uppercase font-semibold">Tactical Device</label>
                      <select
                        value={userAssignments[op]?.device || ''}
                        onChange={(e) => handleSelectAssignment(op, 'device', e.target.value)}
                        className="w-full bg-[#0e1217] border border-[#2a3242] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="">-- Select Device --</option>
                        {devices.map(dev => (
                          <option key={dev} value={dev}>{dev}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#232936] flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Double check clues and scratchpad entries before submittal
            </span>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Decrypt & Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
