import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { registerUser, setUsernameCookie } from '@/lib/api';
import { Terminal } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setIsLoading(true);

    try {
      await registerUser(username);
      setUsernameCookie(username);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('409')) {
        toast.error('Username already taken');
      } else if (errorMessage.includes('400')) {
        toast.error('Invalid username');
      } else if (errorMessage.includes('403')) {
        toast.error('Already logged in');
      } else {
        toast.error('Login failed. Make sure the server is running on localhost:8080');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Terminal className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">S-Emulator</CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your username to access the system
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="h-12 text-base"
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Login'}
            </Button>
          </form>
          <div className="mt-6 p-3 rounded-md bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              Server must be running on <span className="font-mono text-foreground">localhost:8080</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
