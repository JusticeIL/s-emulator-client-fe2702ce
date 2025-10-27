import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { fetchPrograms, getUsernameCookie, deleteUsernameCookie, type Program } from '@/lib/api';
import { LogOut, Play, Terminal, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [username, setUsername] = useState<string>('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUsernameCookie();
    if (!user) {
      navigate('/');
      return;
    }
    setUsername(decodeURIComponent(user));
    loadPrograms();
  }, [navigate]);

  const loadPrograms = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPrograms();
      setPrograms(data || []);
    } catch (error) {
      toast.error('Failed to load programs. Check server connection.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    deleteUsernameCookie();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleRunProgram = (programName: string) => {
    navigate(`/execution?program=${encodeURIComponent(programName)}`);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Terminal className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">S-Emulator Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {username}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Programs Card */}
        <Card>
          <CardHeader>
            <CardTitle>Available Programs</CardTitle>
            <CardDescription>
              Select a program to execute
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No programs available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload programs to the server to see them here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Program Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Expansion Level</th>
                      <th className="text-left py-3 px-4 font-semibold">Cycles</th>
                      <th className="text-right py-3 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.map((program, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono">{program.name}</td>
                        <td className="py-3 px-4">{program.expansionLevel || 'N/A'}</td>
                        <td className="py-3 px-4">{program.statistics?.cycles || 0}</td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            size="sm" 
                            onClick={() => handleRunProgram(program.name)}
                            className="gap-2"
                          >
                            <Play className="h-3 w-3" />
                            Run
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
