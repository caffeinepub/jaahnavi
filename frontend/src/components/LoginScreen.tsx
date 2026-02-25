import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface LoginScreenProps {
  onLogin: () => void;
  onSignupClick: () => void;
}

export default function LoginScreen({ onLogin, onSignupClick }: LoginScreenProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate authentication check
      // In a real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (username === 'admin' && password === 'admin') {
        onLogin();
      } else {
        toast.error('Invalid credentials. Try admin/admin');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[oklch(0.145_0_0)] via-[oklch(0.145_0_0)] to-[oklch(0.205_0_0)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.488_0.243_264.376/0.2),transparent_70%)]" />
      
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            JAAHNAVI
          </h1>
          <p className="text-sm text-muted-foreground">All F&O Stocks Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-background/60"
            />
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/60"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'LOGIN DASHBOARD'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSignupClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Don't have an account? <span className="text-primary font-medium">Sign Up</span>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-chart-2" />
          System Active • Simulated Backend
        </div>
      </div>
    </div>
  );
}
