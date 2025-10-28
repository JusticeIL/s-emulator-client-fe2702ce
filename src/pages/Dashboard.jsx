import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchSharedPrograms, 
  fetchSharedFunctions,
  fetchAllUsers,
  fetchUser,
  addCredits,
  setActiveProgram, 
  getUsernameCookie 
} from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [programs, setPrograms] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [addingCredits, setAddingCredits] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = getUsernameCookie();
    if (!user) {
      navigate("/");
      return;
    }
    setUsername(user);

    const loadData = async () => {
      try {
        const [programsData, functionsData, usersData] = await Promise.all([
          fetchSharedPrograms(),
          fetchSharedFunctions(),
          fetchAllUsers()
        ]);
        
        setPrograms(Array.isArray(programsData) ? programsData : []);
        setFunctions(Array.isArray(functionsData) ? functionsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Polling every 1.5 seconds
    const interval = setInterval(loadData, 1500);
    return () => clearInterval(interval);
  }, [navigate, toast]);

  const handleAddCredits = async () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    setAddingCredits(true);
    try {
      await addCredits(amount);
      toast({
        title: "Success",
        description: `Added ${amount} credits successfully`,
      });
      setCreditAmount("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add credits",
        variant: "destructive",
      });
    } finally {
      setAddingCredits(false);
    }
  };

  const handleSelectUser = async (username) => {
    try {
      const userData = await fetchUser(username);
      setSelectedUser(userData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    }
  };

  const handleRunProgram = async (programName) => {
    try {
      const response = await setActiveProgram(programName);
      
      if (response.ok) {
        navigate('/execution');
      } else {
        toast({
          title: "Error",
          description: "Failed to set active program",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set active program",
        variant: "destructive",
      });
    }
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
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header with Credits in Top Right */}
        <div className="flex justify-between items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">S-Emulator Dashboard</h1>
              <ThemeToggle />
            </div>
            <p className="text-muted-foreground mt-1">Welcome, {username}</p>
          </div>
          
          {/* Compact Credit Management - Top Right */}
          <Card className="w-full max-w-[300px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="1"
                  className="h-9"
                />
                <Button onClick={handleAddCredits} disabled={addingCredits} size="sm">
                  {addingCredits && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2x2 Grid for Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Left - Users */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Click a user to view their statistics</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users connected</p>
              ) : (
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Programs</TableHead>
                        <TableHead>Functions</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Used</TableHead>
                        <TableHead>Executions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user, index) => (
                        <TableRow 
                          key={index} 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleSelectUser(user.username)}
                        >
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.programsLoaded || 0}</TableCell>
                          <TableCell>{user.functionsLoaded || 0}</TableCell>
                          <TableCell>{user.credits || 0}</TableCell>
                          <TableCell>{user.creditsUsed || 0}</TableCell>
                          <TableCell>{user.executions || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Right - Programs */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Programs</CardTitle>
              <CardDescription>Available programs</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {programs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No programs available</p>
              ) : (
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program Name</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Instructions</TableHead>
                        <TableHead>Max Level</TableHead>
                        <TableHead>Times Exec</TableHead>
                        <TableHead>Avg Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((program, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{program.programName || 'Unknown'}</TableCell>
                          <TableCell>{program.userUploading || 'N/A'}</TableCell>
                          <TableCell>{program.instructionsAtLevel0 || 0}</TableCell>
                          <TableCell>{program.maxProgramLevel || 0}</TableCell>
                          <TableCell>{program.timesExecuted || 0}</TableCell>
                          <TableCell>{program.averageCreditCost?.toFixed(2) || '0.00'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Left - User Statistics */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>
                {selectedUser ? `Execution history for ${selectedUser.username}` : 'Select a user to view statistics'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {selectedUser && selectedUser.executionHistory && selectedUser.executionHistory.length > 0 ? (
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Run ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Arch Type</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Y</TableHead>
                        <TableHead>Cycles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUser.executionHistory.map((exec, index) => (
                        <TableRow key={index}>
                          <TableCell>{exec.runId || index + 1}</TableCell>
                          <TableCell>{exec.type || 'Program'}</TableCell>
                          <TableCell className="font-medium">{exec.programName || 'N/A'}</TableCell>
                          <TableCell>{exec.architectureType || 'N/A'}</TableCell>
                          <TableCell>{exec.level || 0}</TableCell>
                          <TableCell>{exec.yValue || 0}</TableCell>
                          <TableCell>{exec.cycles || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {selectedUser ? 'No execution history available' : 'Select a user to view their execution history'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bottom Right - Functions */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Functions</CardTitle>
              <CardDescription>Available functions</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {functions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No functions available</p>
              ) : (
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Function Name</TableHead>
                        <TableHead>Program Origin</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Instructions</TableHead>
                        <TableHead>Max Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {functions.map((func, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{func.programName || 'Unknown'}</TableCell>
                          <TableCell>{func.programOrigin || 'N/A'}</TableCell>
                          <TableCell>{func.userUploading || 'N/A'}</TableCell>
                          <TableCell>{func.instructionsAtLevel0 || 0}</TableCell>
                          <TableCell>{func.maxProgramLevel || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
