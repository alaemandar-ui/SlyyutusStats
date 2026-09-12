import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';

// Pages
import { HomePage } from './pages/HomePage';
import { StatsPage } from './pages/StatsPage';
import { LeaguePage } from './pages/LeaguePage';
import { ChatPage } from './pages/ChatPage';
import { SeasonsPage } from './pages/SeasonsPage';
import { SeasonDetailPage } from './pages/SeasonDetailPage';
import { VodsPage } from './pages/VodsPage';
import { VodDetailPage } from './pages/VodDetailPage';
import { UsersPage } from './pages/UsersPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { MyStatsPage } from './pages/MyStatsPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { MiniGamesPage } from './pages/MiniGamesPage';
import { QnAPage } from './pages/QnAPage';
import { fetchChannelStats } from './lib/api';
import { ChannelStats } from './types';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);

  useEffect(() => {
    fetchChannelStats()
      .then(setChannelStats)
      .catch(() => {});
  }, []);

  // Handle URL hash and pathname routing
  useEffect(() => {
    const handleRouteSync = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      const path = window.location.pathname.replace(/^\//, '').split('?')[0];
      const targetRoute = hash || path || 'home';
      setCurrentRoute(targetRoute);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    handleRouteSync();

    window.addEventListener('hashchange', handleRouteSync);
    window.addEventListener('popstate', handleRouteSync);
    return () => {
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('popstate', handleRouteSync);
    };
  }, []);

  const navigate = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderRoute = () => {
    // Route matching
    if (currentRoute === 'home' || currentRoute === '') {
      return <HomePage navigate={navigate} />;
    }
    if (currentRoute === 'stats') {
      return <StatsPage />;
    }
    if (currentRoute === 'league') {
      return <LeaguePage navigate={navigate} />;
    }
    if (currentRoute === 'chat') {
      return <ChatPage navigate={navigate} />;
    }
    if (currentRoute === 'seasons') {
      return <SeasonsPage navigate={navigate} />;
    }
    if (currentRoute.startsWith('season/')) {
      const seasonId = currentRoute.replace('season/', '');
      return <SeasonDetailPage seasonId={seasonId} navigate={navigate} />;
    }
    if (currentRoute === 'vods') {
      return <VodsPage navigate={navigate} />;
    }
    if (currentRoute.startsWith('vod/')) {
      const streamId = currentRoute.replace('vod/', '');
      return <VodDetailPage streamId={streamId} navigate={navigate} />;
    }
    if (currentRoute === 'users') {
      return <UsersPage navigate={navigate} />;
    }
    if (currentRoute.startsWith('user/')) {
      const username = decodeURIComponent(currentRoute.replace('user/', ''));
      return <UserProfilePage username={username} navigate={navigate} />;
    }
    if (currentRoute === 'my-stats') {
      return <MyStatsPage navigate={navigate} defaultTab="minigames" />;
    }
    if (currentRoute === 'my-performance' || currentRoute === 'performance') {
      return <MiniGamesPage navigate={navigate} initialTab="mystats" />;
    }
    if (currentRoute === 'leaderboard') {
      return <MiniGamesPage navigate={navigate} initialTab="leaderboard" />;
    }
    if (currentRoute === 'login') {
      return <LoginPage navigate={navigate} />;
    }
    if (currentRoute === 'admin') {
      return <AdminPage navigate={navigate} />;
    }
    if (currentRoute === 'minigames' || currentRoute === 'games') {
      return <MiniGamesPage navigate={navigate} />;
    }
    if (currentRoute === 'qa' || currentRoute === 'qna' || currentRoute === 'questions') {
      return <QnAPage navigate={navigate} />;
    }

    return <HomePage navigate={navigate} />;
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col selection:bg-[#D4AF37] selection:text-black font-sans antialiased">
        <Navbar 
          currentRoute={currentRoute} 
          navigate={navigate} 
          channelLive={channelStats?.isLive || false} 
          viewerCount={channelStats?.currentViewers || 0} 
        />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          {renderRoute()}
        </main>

        <Footer navigate={navigate} />
        <Toast />
      </div>
    </AuthProvider>
  );
}
