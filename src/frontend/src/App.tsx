import { useState } from 'react';
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

export type ViewType = 'dashboard' | 'watchlist' | 'option-chain' | 'scanner-oh' | 'scanner-ol' | 'fo-list' | 'candle-analysis' | 'sectors' | 'news';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowSignup(false);
    toast.success('Welcome to JAAHNAVI Pro');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    setCurrentView('option-chain');
  };

  const handleSignupClick = () => {
    setShowSignup(true);
  };

  const handleBackToLogin = () => {
    setShowSignup(false);
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
  };

  if (!isAuthenticated) {
    if (showSignup) {
      return <SignupScreen onBackToLogin={handleBackToLogin} onSignupSuccess={handleSignupSuccess} />;
    }
    return <LoginScreen onLogin={handleLogin} onSignupClick={handleSignupClick} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />
      
      <main className="flex flex-1 flex-col overflow-hidden">
        <NewsTicker />
        <Header onLogout={handleLogout} onSymbolSelect={handleSymbolSelect} />
        
        <div className="flex-1 overflow-y-auto p-6">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'watchlist' && <WatchlistView onSymbolClick={handleSymbolSelect} />}
          {currentView === 'option-chain' && <OptionChainView selectedSymbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />}
          {currentView === 'scanner-oh' && <BullishScannerView />}
          {currentView === 'scanner-ol' && <BearishScannerView />}
          {currentView === 'fo-list' && <FOListView onSymbolClick={handleSymbolSelect} />}
          {currentView === 'candle-analysis' && <CandleAnalysisView />}
          {currentView === 'sectors' && <SectorsView />}
          {currentView === 'news' && <NewsFeedView />}
        </div>
      </main>
      
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
