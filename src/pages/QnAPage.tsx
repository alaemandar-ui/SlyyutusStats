import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../components/UserAvatar';
import { 
  fetchPublicQuestions,
  fetchAdminQuestions, 
  fetchMyQuestions, 
  submitQuestion, 
  answerAdminQuestion, 
  updateAdminQuestionStatus, 
  deleteAdminQuestion, 
  QuestionItem 
} from '../lib/api';
import { 
  HelpCircle, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  LogIn, 
  User, 
  AlertCircle,
  Award,
  RefreshCw,
  Crown
} from 'lucide-react';

interface QnAPageProps {
  navigate: (route: string) => void;
}

export const QnAPage: React.FC<QnAPageProps> = ({ navigate }) => {
  const { isAuthenticated, user, isAdmin, showToast } = useAuth();

  // Active filter tab: 'all' | 'answered' | 'pending' | 'my' | 'admin'
  const [activeTab, setActiveTab] = useState<'all' | 'answered' | 'pending' | 'my' | 'admin'>('all');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [myQuestions, setMyQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Counts from backend
  const [stats, setStats] = useState({
    total: 0,
    pendingCount: 0,
    answeredCount: 0,
    rejectedCount: 0
  });

  // Question submission form
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Admin answering state
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState<string>('');
  const [savingAnswer, setSavingAnswer] = useState<boolean>(false);

  useEffect(() => {
    loadQuestions();
    if (isAuthenticated) {
      loadMyQuestions();
    }
  }, [activeTab, isAuthenticated]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // If admin tab selected, query all statuses via admin endpoint
      if (activeTab === 'admin' && !isAdmin) {
        setActiveTab('all');
        return;
      }

      const statusFilter = activeTab === 'admin' 
        ? 'all' 
        : activeTab === 'all' 
        ? undefined 
        : activeTab === 'answered' 
        ? 'answered' 
        : activeTab === 'pending' 
        ? 'pending' 
        : undefined;

      const data = (activeTab === 'admin' && isAdmin)
        ? await fetchAdminQuestions(statusFilter)
        : await fetchPublicQuestions(statusFilter);

      setQuestions(data.questions || []);
      setStats({
        total: data.total || 0,
        pendingCount: data.pendingCount || 0,
        answeredCount: data.answeredCount || 0,
        rejectedCount: data.rejectedCount || 0
      });
    } catch (err: any) {
      console.error('Failed to load questions:', err);
      showToast(err.message || 'Failed to fetch questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMyQuestions = async () => {
    try {
      const data = await fetchMyQuestions();
      setMyQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to load my questions:', err);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please log in to submit a question.', 'error');
      navigate('login');
      return;
    }

    const trimmed = newQuestionText.trim();
    if (!trimmed) {
      showToast('Please enter your question.', 'error');
      return;
    }

    if (trimmed.length < 5) {
      showToast('Question must be at least 5 characters long.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitQuestion(trimmed);
      showToast(res.message || 'Question submitted successfully! Slyyutus will review it shortly.', 'success');
      setNewQuestionText('');
      loadQuestions();
      loadMyQuestions();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit question.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    const trimmed = answerDraft.trim();
    if (!trimmed) {
      showToast('Answer cannot be blank.', 'error');
      return;
    }

    setSavingAnswer(true);
    try {
      await answerAdminQuestion(questionId, trimmed);
      showToast('Official response published to question!', 'success');
      setAnsweringQuestionId(null);
      setAnswerDraft('');
      loadQuestions();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit answer.', 'error');
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleStatusChange = async (questionId: string, status: 'pending' | 'answered' | 'rejected') => {
    try {
      await updateAdminQuestionStatus(questionId, status);
      showToast(`Question marked as ${status}.`, 'success');
      loadQuestions();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await deleteAdminQuestion(questionId);
      showToast('Question deleted successfully.', 'success');
      loadQuestions();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete question.', 'error');
    }
  };

  const displayList = activeTab === 'my' ? myQuestions : questions;
  const filteredQuestions = displayList.filter(q => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.question.toLowerCase().includes(query) ||
      q.username.toLowerCase().includes(query) ||
      (q.answer && q.answer.toLowerCase().includes(query))
    );
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 py-6 pb-24 text-white">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#D4AF37]/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-mono text-xs uppercase tracking-wider mb-1.5">
            <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>Direct Chatter Access • Live Stream Q&A</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white uppercase tracking-tight">
            COMMUNITY <span className="text-[#D4AF37]">Q&A</span>
          </h1>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Have questions about stream highlights, strategies, setups, or upcoming events? Submit your question below for Slyyutus to review and answer.
          </p>
        </div>

        {/* Quick Stats Metric Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-[#111] border border-[#D4AF37]/30 px-4 py-2.5 rounded-xl text-center shadow-lg">
            <div className="text-[10px] font-mono uppercase text-[#D4AF37]">ANSWERED</div>
            <div className="text-xl font-black text-white">{stats.answeredCount}</div>
          </div>
          <div className="bg-[#111] border border-zinc-800 px-4 py-2.5 rounded-xl text-center shadow-lg">
            <div className="text-[10px] font-mono uppercase text-zinc-400">PENDING</div>
            <div className="text-xl font-black text-[#D4AF37]">{stats.pendingCount}</div>
          </div>
          <button
            onClick={loadQuestions}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/50 text-zinc-400 hover:text-white transition"
            title="Refresh Q&A"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-[#D4AF37]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Submission Box & Questions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Ask a Question Form */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#141820] to-[#0d0f14] p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black font-heading text-white uppercase tracking-wider">
                  Ask Slyyutus
                </h3>
                <span className="text-xs font-mono text-zinc-400">Direct streamer inbox</span>
              </div>
            </div>

            {isAuthenticated ? (
              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                {/* User Identity Preview */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#090b0e] border border-zinc-800/80">
                  <UserAvatar
                    src={user?.avatarUrl}
                    avatarUrl={user?.avatarUrl}
                    username={user?.username}
                    userId={user?.kickUserId}
                    size="sm"
                  />
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-white block truncate">{user?.username}</span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Authenticated Chatter
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-300 block">Your Question:</label>
                  <textarea
                    rows={4}
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="e.g. What keybinds do you use for Apex? Or when is the next community tournament?"
                    maxLength={500}
                    className="w-full bg-[#090b0e] border border-zinc-700/80 rounded-lg p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition font-sans resize-none"
                  />
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                    <span>Be respectful & concise</span>
                    <span>{newQuestionText.length}/500</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !newQuestionText.trim()}
                  className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-heading font-black text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SUBMITTING QUESTION...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>SUBMIT QUESTION</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="bg-[#090b0e] border border-zinc-800 rounded-xl p-5 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-[#D4AF37]">
                  <LogIn className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Log in to ask questions</h4>
                  <p className="text-xs font-mono text-zinc-400 mt-1 leading-relaxed">
                    Connect your Kick account to submit questions directly to Slyyutus and get notified when answered.
                  </p>
                </div>
                <button
                  onClick={() => navigate('login')}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#D4AF37] text-black font-heading font-black text-xs uppercase tracking-wider hover:bg-[#FFD700] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>LOG IN NOW</span>
                </button>
              </div>
            )}
          </div>

          {/* Q&A Guidelines Card */}
          <div className="rounded-xl border border-zinc-800/80 bg-[#11141a] p-5 space-y-3 font-mono text-xs text-zinc-400">
            <h4 className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5 text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" /> Community Guidelines
            </h4>
            <ul className="space-y-2 list-disc list-inside text-zinc-400 text-[11px] leading-relaxed">
              <li>Keep questions relevant to the stream, games, and community.</li>
              <li>Questions with helpful advice or entertaining topics will be prioritized during stream.</li>
              <li>Slyyutus answers pending questions regularly live on Kick!</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Questions Feed & Admin Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#11141a] p-3.5 rounded-xl border border-[#D4AF37]/20">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${
                  activeTab === 'all'
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('answered')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${
                  activeTab === 'answered'
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                Answered ({stats.answeredCount})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${
                  activeTab === 'pending'
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                Pending ({stats.pendingCount})
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => setActiveTab('my')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${
                    activeTab === 'my'
                      ? 'bg-[#D4AF37] text-black font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  My Questions ({myQuestions.length})
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition flex items-center gap-1 ${
                    activeTab === 'admin'
                      ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'text-amber-400 hover:bg-amber-400/10 border border-amber-500/30'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Slyyutus Desk</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full bg-[#0a0c10] border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] font-mono"
              />
            </div>
          </div>

          {/* Questions Feed */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
              <p className="text-xs font-mono text-zinc-400">Loading community questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800/80 bg-[#11141a] p-12 text-center space-y-3">
              <HelpCircle className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No questions found</h3>
              <p className="text-xs font-mono text-zinc-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No questions matched "${searchQuery}". Try a different search term.`
                  : activeTab === 'my'
                  ? "You haven't submitted any questions yet. Use the form on the left to ask Slyyutus anything!"
                  : 'Be the first to submit a question to the community stream board!'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q) => {
                const isAnswered = q.status === 'answered';
                const isRejected = q.status === 'rejected';
                const isPending = q.status === 'pending';
                const isAnsweringThis = answeringQuestionId === q.id;

                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border transition-all duration-200 bg-[#11141c] ${
                      isAnswered
                        ? 'border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                        : isRejected
                        ? 'border-rose-900/40 opacity-70'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Question Header Card */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Author Info */}
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={q.avatarUrl}
                            avatarUrl={q.avatarUrl}
                            username={q.username}
                            userId={q.kickUserId}
                            size="md"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{q.username}</span>
                              {q.userId === user?.kickUserId && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 block">
                              {formatDate(q.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isAnswered && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                              <CheckCircle2 className="w-3 h-3" /> ANSWERED
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold">
                              <Clock className="w-3 h-3" /> PENDING REVIEW
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 text-[10px] font-mono font-bold">
                              <XCircle className="w-3 h-3" /> REJECTED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Body */}
                      <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed">
                        {q.question}
                      </p>

                      {/* Verified Streamer Answer Section */}
                      {isAnswered && q.answer && (
                        <div className="mt-4 rounded-xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#1a160d] to-[#12141a] p-4 sm:p-5 space-y-3 shadow-md">
                          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded bg-[#D4AF37] text-black">
                                <Crown className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-black font-heading text-[#D4AF37] uppercase tracking-wider">
                                Slyyutus Verified Answer
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {formatDate(q.answeredAt)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                            {q.answer}
                          </p>
                        </div>
                      )}

                      {/* Admin Inline Response Editor */}
                      {isAdmin && isAnsweringThis && (
                        <div className="mt-4 p-4 rounded-xl border border-amber-500/60 bg-[#0d1017] space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
                            <span>Publish Official Answer</span>
                            <button
                              onClick={() => { setAnsweringQuestionId(null); setAnswerDraft(''); }}
                              className="text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            value={answerDraft}
                            onChange={(e) => setAnswerDraft(e.target.value)}
                            placeholder="Type your official answer to the chatter..."
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] font-sans resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setAnsweringQuestionId(null); setAnswerDraft(''); }}
                              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-xs hover:bg-zinc-700"
                            >
                              Dismiss
                            </button>
                            <button
                              disabled={savingAnswer || !answerDraft.trim()}
                              onClick={() => handleAnswerSubmit(q.id)}
                              className="px-4 py-1.5 rounded-lg bg-[#D4AF37] text-black font-heading font-black text-xs uppercase hover:bg-[#FFD700] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                            >
                              {savingAnswer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              <span>PUBLISH ANSWER</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Admin Action Bar (Slyyutus Only) */}
                      {isAdmin && (
                        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-[10px] uppercase">Admin Actions:</span>
                            <button
                              onClick={() => {
                                setAnsweringQuestionId(q.id);
                                setAnswerDraft(q.answer || '');
                              }}
                              className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{isAnswered ? 'Edit Answer' : 'Answer'}</span>
                            </button>
                            {isPending && (
                              <button
                                onClick={() => handleStatusChange(q.id, 'rejected')}
                                className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            )}
                            {isRejected && (
                              <button
                                onClick={() => handleStatusChange(q.id, 'pending')}
                                className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
                              >
                                Restore to Pending
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => handleDelete(q.id)}
                            className="text-zinc-500 hover:text-rose-400 transition p-1"
                            title="Delete question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
