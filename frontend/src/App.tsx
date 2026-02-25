import React, { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NewsTicker from './components/NewsTicker';
import Dashboard from './views/Dashboard';
import WatchlistView from './views/WatchlistView';
import OptionChainView from './views/OptionChainView';
import BullishScannerView from './views/BullishScannerView';
import BearishScannerView from './views/BearishScannerView';
import FOListView from './views/FOListView';
import CandleAnalysisView from './views/CandleAnalysisView';
import SectorsView from './views/SectorsView';
import NewsFeedView from './views/NewsFeedView';
import {
  useLiveMarketData,
  useGetMarketSnapshot,
  useMarketSnapshotSync,
  useNSEPolling,
  stopLiveMarket,
} from './hooks/useQueries';

export type ViewType =
  | 'dashboard'
  | 'watchlist'
  | 'option-chain'
  | 'bullish-scanner'
  | 'bearish-scanner'
  | 'fo-list'
  | 'candle-analysis'
  | 'sectors'
  | 'news';

function AppShell() {
  // Initialize live market data at root so single interval drives all views
  useLiveMarketData();
  useGetMarketSnapshot();
  useMarketSnapshotSync();
  // Start NSE backend polling (every 5 seconds)
  useNSEPolling();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  const handleLogin = () => {
    setIsAuthenticated(true);
    toast.success('Welcome to JAAHNAVI Pro');
  };

  const handleLogout = () => {
    stopLiveMarket();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  if (!isAuthenticated) {
    if (showSignup) {
      return (
        <SignupScreen
          onBackToLogin={() => setShowSignup(false)}
          onSignupSuccess={() => setShowSignup(false)}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={handleLogin}
        onSignupClick={() => setShowSignup(true)}
      />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'watchlist': return <WatchlistView />;
      case 'option-chain': return <OptionChainView />;
      case 'bullish-scanner': return <BullishScannerView />;
      case 'bearish-scanner': return <BearishScannerView />;
      case 'fo-list': return <FOListView />;
      case 'candle-analysis': return <CandleAnalysisView />;
      case 'sectors': return <SectorsView />;
      case 'news': return <NewsFeedView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <NewsTicker />
        <Header onLogout={handleLogout} />

        <div className="flex-1 overflow-y-auto p-4">
          {renderView()}
        </div>

        <footer className="border-t border-border px-6 py-2 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} JAAHNAVI F&O Analytics &nbsp;|&nbsp; Built with{' '}
          <span className="text-red-400">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
