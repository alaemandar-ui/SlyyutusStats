import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  ShieldCheck, 
  Lock, 
  AlertCircle,
  ExternalLink,
  Shield,
  CheckCircle2
} from 'lucide-react';

export const LoginPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Read error parameter from both search query and hash query
  const hashSearch = window.location.hash.includes('?') 
    ? window.location.hash.substring(window.location.hash.indexOf('?')) 
    : '';
  const urlParams = new URLSearchParams(window.location.search || hashSearch);
  const oauthError = urlParams.get('error');

  const getErrorMessage = (err: string) => {
    switch (err) {
      case 'oauth_not_configured':
        return 'OAuth configuration error: Kick Client ID or Client Secret is missing or not configured in your environment.';
      case 'redirect_uri_mismatch':
        return 'Redirect URI mismatch: The redirect URI configured in your Kick Developer Portal does not match http://127.0.0.1:3000/auth/callback.';
      case 'access_denied':
        return 'Authorization denied: The login request was cancelled or authorization was not granted on the Kick consent screen.';
      case 'token_exchange_failed':
        return 'Token exchange failed: Kick OAuth servers rejected the authorization code or verifier. Verify your client credentials.';
      case 'kick_api_unavailable':
        return 'Kick API unavailable: Could not connect to official Kick servers. Please try again in a few moments.';
      case 'kick_profile_failed':
        return 'Authenticated user lookup failed: Successfully authorized, but Kick API could not retrieve profile data for your account.';
      case 'missing_code':
        return 'Missing authorization code: The Kick OAuth server did not return a valid authorization code.';
      default:
        return `Authentication notice: ${err}`;
    }
  };

  const handleOfficialKickLogin = () => {
    // Redirects to backend Kick OAuth initiation endpoint
    window.location.href = '/api/auth/kick/login';
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#D4AF37]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-heading text-zinc-100 uppercase">
          Session Active
        </h2>
        <p className="text-sm font-mono text-zinc-400">
          You are currently authenticated as <strong className="text-[#D4AF37]">{user.username}</strong> ({user.role.toUpperCase()}).
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate('minigames')}
            className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-zinc-950 font-heading font-bold uppercase text-xs hover:bg-[#FFD700] transition-all shadow-lg flex items-center gap-2"
          >
            <span>Play Games</span>
          </button>
          <button
            onClick={() => navigate('my-stats')}
            className="px-6 py-2.5 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-700 font-heading font-bold uppercase text-xs hover:bg-zinc-800 transition-all"
          >
            Go to My Stats
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => navigate('admin')}
              className="px-6 py-2.5 rounded-xl bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/40 font-heading font-bold uppercase text-xs hover:bg-[#D4AF37]/30 transition-all"
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono">
          <Lock className="w-3.5 h-3.5" />
          <span>Official Kick OAuth 2.0</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-heading text-white uppercase tracking-tight">
          Login to <span className="text-[#D4AF37]">SLYYUTUS.STATS</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-lg mx-auto">
          Authenticate directly with your official Kick.com account to track your chat activity, earn season badges, and access personalized metrics.
        </p>

        {oauthError && (
          <div className="max-w-md mx-auto p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono text-left flex items-start gap-3 mt-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-300 uppercase tracking-wider mb-1">OAuth Authorization Notice</div>
              <div>
                {getErrorMessage(oauthError)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Official Kick OAuth Card */}
      <div className="rounded-3xl border border-[#D4AF37]/30 bg-zinc-950/90 p-8 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-[#53FC18]/10 text-[#53FC18] border border-[#53FC18]/30">
            <LogIn className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-heading text-white uppercase">
              Continue with Kick Account
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Secure authentication via id.kick.com
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2 text-xs font-mono text-zinc-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#53FC18] shrink-0" />
            <span>Automatic Kick user ID and username verification</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#53FC18] shrink-0" />
            <span>Real-time Slyyutus channel chat & league stats</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#53FC18] shrink-0" />
            <span>Admin auto-detection for designated administrators</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#53FC18] shrink-0" />
            <span>No passwords stored — 100% OAuth 2.0 PKCE / state token flow</span>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <button
            onClick={handleOfficialKickLogin}
            className="w-full py-4 rounded-xl font-heading font-extrabold text-sm uppercase tracking-wider bg-[#53FC18] text-black hover:bg-[#47dc14] transition-all flex items-center justify-center gap-2.5 shadow-xl hover:shadow-[#53FC18]/20"
          >
            <ExternalLink className="w-5 h-5" />
            <span>CONTINUE WITH KICK OAUTH</span>
          </button>

          <p className="text-[11px] text-center font-mono text-zinc-500">
            Redirects to <span className="text-zinc-400">id.kick.com/oauth/authorize</span> and returns securely to your dashboard.
          </p>
        </div>
      </div>

    </div>
  );
};
