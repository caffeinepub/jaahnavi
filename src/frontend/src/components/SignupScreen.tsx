import { useState } from 'react';
import { useSignup } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserProfile } from '../backend';

interface SignupScreenProps {
  onBackToLogin: () => void;
  onSignupSuccess: () => void;
}

export default function SignupScreen({ onBackToLogin, onSignupSuccess }: SignupScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const signupMutation = useSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }

    try {
      const profile: UserProfile = {
        username,
        name,
      };
      
      await signupMutation.mutateAsync({ username, password, profile });
      toast.success('Account created successfully! Please login.');
      onSignupSuccess();
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        toast.error('Username already exists. Please choose another.');
      } else {
        toast.error('Failed to create account. Please try again.');
      }
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
          <p className="text-sm text-muted-foreground">Create Your Account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/60"
              required
            />
          </div>

          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-background/60"
              required
            />
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/60"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? 'Creating Account...' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account? <span className="text-primary font-medium">Login</span>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-chart-2" />
          System Active • Secure Registration
        </div>
      </div>
    </div>
  );
}
