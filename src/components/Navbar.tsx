import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  BarChart3, 
  Calendar, 
  Video, 
  Users, 
  User, 
  ShieldAlert, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  Radio, 
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  channelLive?: boolean;
  viewerCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate, channelLive = false, viewerCount = 0 }) => {
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { label: 'HOME', route: 'home', icon: Sparkles },
    { label: 'STATS', route: 'stats', icon: BarChart3 },
    { label: 'LEAGUE', route: 'league', icon: Trophy, badge: 'Active' },
    { label: 'CHAT', route: 'chat', icon: MessageSquare },
    { label: 'SEASONS', route: 'seasons', icon: Calendar },
    { label: 'VODS', route: 'vods', icon: Video },
    { label: 'USERS', route: 'users', icon: Users },
  ];

  const handleNav = (route: string) => {
    navigate(route);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D4AF37]/20 bg-[#0A0A0A]/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo & Live Ticker */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-tr from-[#D4AF37] to-[#FFD700] rounded-sm transform rotate-45 shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center justify-center shrink-0">
                <span className="transform -rotate-45 font-black text-black text-xs sm:text-sm select-none">S</span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-tighter text-[#D4AF37] group-hover:text-[#FFD700] transition-colors leading-none block">
                  SLYYUTUS<span className="text-white">.STATS</span>
                </span>
                <span className="text-[9px] tracking-widest uppercase font-bold text-gray-500 block -mt-0.5">
                  COMMUNITY LEAGUE
                </span>
              </div>
            </button>

            {/* Kick Channel Live Badge */}
            <a
              href="https://kick.com/slyyutus"
              target="_blank"
              rel="noreferrer"
              className={`hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-widest uppercase border transition-all ${
                channelLive
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-[#111] border-zinc-800 text-gray-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${channelLive ? 'bg-red-500 animate-ping' : 'bg-gray-500'}`} />
              <span>{channelLive ? `LIVE • ${viewerCount} VIEWERS` : 'OFFLINE'}</span>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            {navItems.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => handleNav(item.route)}
                  className={`py-1 transition-colors ${
                    isActive
                      ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                      : 'hover:text-[#D4AF37]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded-sm bg-[#D4AF37]/20 text-[#D4AF37] font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* MY STATS */}
            <button
              onClick={() => handleNav('my-stats')}
              className={`py-1 transition-colors ${
                currentRoute === 'my-stats'
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'hover:text-[#D4AF37]'
              }`}
            >
              <span>MY STATS</span>
            </button>

            {/* ADMIN LINK (Only for Admins) */}
            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`py-1 transition-colors ${
                  currentRoute === 'admin'
                    ? 'text-rose-400 border-b-2 border-rose-400'
                    : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <span>ADMIN</span>
              </button>
            )}
          </nav>

          {/* Right Action: Profile or Login with Kick */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-sm bg-[#111] border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all focus:outline-none"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-sm object-cover border border-[#D4AF37]/40"
                  />
                  <div className="text-left">
                    <span className="text-xs font-black tracking-tight text-white block truncate max-w-[100px]">
                      {user.username}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#D4AF37] block -mt-0.5">
                      {user.role}
                    </span>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-sm bg-[#0A0A0A] border border-[#D4AF37]/30 shadow-2xl p-2 z-50 animate-in fade-in">
                    <button
                      onClick={() => handleNav(`user/${user.username}`)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-[#D4AF37] hover:bg-[#111] text-left"
                    >
                      <User className="w-4 h-4 text-[#D4AF37]" />
                      <span>View Public Profile</span>
                    </button>
                    <button
                      onClick={() => handleNav('my-stats')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-[#D4AF37] hover:bg-[#111] text-left"
                    >
                      <Trophy className="w-4 h-4 text-[#D4AF37]" />
                      <span>My League Progress</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleNav('admin')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-500/10 text-left"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>Admin Control Panel</span>
                      </button>
                    )}
                    <div className="my-1 border-t border-zinc-800" />
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-rose-400 hover:bg-[#111] text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Disconnect Session</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNav('login')}
                className="bg-[#D4AF37] text-black px-4 py-1.5 rounded-sm font-black uppercase tracking-widest text-[11px] hover:bg-[#FFD700] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>LOGIN</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden gap-2">
            {channelLive && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-widest uppercase bg-red-500/10 text-red-400 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-sm bg-[#111] text-gray-400 hover:text-white border border-[#D4AF37]/20"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D4AF37]/20 bg-[#0A0A0A] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => handleNav(item.route)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest font-heading ${
                  isActive
                    ? 'text-[#D4AF37] bg-[#D4AF37]/10 border-l-2 border-[#D4AF37]'
                    : 'text-gray-400 hover:bg-[#111] hover:text-[#D4AF37]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#D4AF37]" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-sm bg-[#D4AF37]/20 text-[#D4AF37]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => handleNav('my-stats')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest font-heading ${
              currentRoute === 'my-stats'
                ? 'text-[#D4AF37] bg-[#D4AF37]/10 border-l-2 border-[#D4AF37]'
                : 'text-gray-400 hover:bg-[#111] hover:text-[#D4AF37]'
            }`}
          >
            <User className="w-4 h-4 text-[#D4AF37]" />
            <span>MY STATS</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest font-heading text-rose-300 bg-rose-500/10 border border-rose-500/30"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>ADMIN CONTROL PANEL</span>
            </button>
          )}

          <div className="pt-3 border-t border-zinc-800">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-lg border border-amber-400/30"
                  />
                  <div>
                    <span className="text-sm font-bold text-zinc-100 block font-heading">{user.username}</span>
                    <span className="text-[10px] font-mono uppercase text-amber-400">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('login')}
                className="w-full py-3 rounded-xl text-center text-sm font-bold font-heading uppercase bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950"
              >
                LOGIN WITH KICK
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
