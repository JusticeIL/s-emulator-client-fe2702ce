import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchPrograms, getUsernameCookie, deleteUsernameCookie } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, LogOut } from "lucide-react";

export default function Dashboard() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = getUsernameCookie();
    if (!user) {
      navigate("/");
      return;
    }
    setUsername(user);

    const loadPrograms = async () => {
      try {
        const data = await fetchPrograms();
        setPrograms(Array.isArray(data) ? data : []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load programs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPrograms();
  }, [navigate, toast]);

  const handleLogout = () => {
    deleteUsernameCookie();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  const handleRunProgram = (programName) => {
    navigate(`/execution?program=${encodeURIComponent(programName)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">S-Emulator Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome, {username}</p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Programs</CardTitle>
            <CardDescription>Select a program to execute</CardDescription>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No programs available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Expansion Level</TableHead>
                    <TableHead>Cycles</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{program.name || 'Unknown'}</TableCell>
                      <TableCell>{program.expansionLevel || 'N/A'}</TableCell>
                      <TableCell>{program.cycles || 0}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleRunProgram(program.name)}
                        >
                          Run
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
