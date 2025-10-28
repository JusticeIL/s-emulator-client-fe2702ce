import { useEffect, useState, useRef } from "react";
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
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [showVariablesPopup, setShowVariablesPopup] = useState(false);
  const [selectedRunVariables, setSelectedRunVariables] = useState(null);
  const failureCount = useRef({ programs: 0, functions: 0, users: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (showVariablesPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showVariablesPopup]);

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
        
        // Reset failure counts on success
        failureCount.current = { programs: 0, functions: 0, users: 0 };
        
        // Sort data
        const sortedPrograms = Array.isArray(programsData) 
          ? [...programsData].sort((a, b) => (a.programName || '').localeCompare(b.programName || ''))
          : [];
        const sortedFunctions = Array.isArray(functionsData)
          ? [...functionsData].sort((a, b) => (a.programName || '').localeCompare(b.programName || ''))
          : [];
        const sortedUsers = Array.isArray(usersData)
          ? [...usersData].sort((a, b) => (a.username || '').localeCompare(b.username || ''))
          : [];
        
        setPrograms(sortedPrograms);
        setFunctions(sortedFunctions);
        setUsers(sortedUsers);
      } catch (error) {
        // Increment failure count
        failureCount.current.programs++;
        failureCount.current.functions++;
        failureCount.current.users++;
        
        // Check if we've failed 3 times consecutively
        if (failureCount.current.programs >= 3 || 
            failureCount.current.functions >= 3 || 
            failureCount.current.users >= 3) {
          navigate('/server-down');
          return;
        }
        
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

  const handleSelectUser = async (user) => {
    // Toggle selection if clicking the same user
    if (selectedUser?.username === user.username) {
      setSelectedUser(null);
      return;
    }
    
    try {
      const userData = await fetchUser(user.username);
      setSelectedUser(userData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    }
  };

  const handleUnselectUser = async () => {
    try {
      const userData = await fetchUser(username);
      setSelectedUser(userData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load current user details",
        variant: "destructive",
      });
    }
  };

  const handleShowVariables = (run) => {
    setSelectedRunVariables(run.finalStateOfAllVariables || {});
    setShowVariablesPopup(true);
  };

  const handleRerun = (run) => {
    toast({
      title: "Rerun",
      description: `Rerun functionality for ${run.programName} will be implemented`,
    });
  };

  const handleExecuteProgram = () => {
    if (!selectedProgram) {
      toast({
        title: "No Program Selected",
        description: "Please select a program to execute",
        variant: "destructive",
      });
      return;
    }
    handleRunProgram(selectedProgram.programName);
  };

  const handleExecuteFunction = () => {
    if (!selectedFunction) {
      toast({
        title: "No Function Selected",
        description: "Please select a function to execute",
        variant: "destructive",
      });
      return;
    }
    handleRunProgram(selectedFunction.programName);
  };

  const sortVariables = (variables) => {
    const entries = Object.entries(variables);
    const sorted = [];
    
    // First, add y variables
    const yVars = entries.filter(([key]) => key.toLowerCase() === 'y');
    sorted.push(...yVars);
    
    // Then, add x variables
    const xVars = entries.filter(([key]) => key.toLowerCase().startsWith('x')).sort();
    sorted.push(...xVars);
    
    // Finally, add z variables
    const zVars = entries.filter(([key]) => key.toLowerCase().startsWith('z')).sort();
    sorted.push(...zVars);
    
    // Add any remaining variables
    const remaining = entries.filter(([key]) => {
      const lower = key.toLowerCase();
      return lower !== 'y' && !lower.startsWith('x') && !lower.startsWith('z');
    });
    sorted.push(...remaining);
    
    return sorted;
  };

  // Get execution history from selected user
  const executionHistory = selectedUser?.history?.history || [];

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
        {/* Header with Theme Toggle and Credits in Top Right */}
        <div className="flex justify-between items-start gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">S-Emulator Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome, {username}</p>
          </div>
          
          {/* Top Right - Theme Toggle and Credits */}
          <div className="flex flex-col items-end gap-4">
            <ThemeToggle />
            
            {/* Compact Credit Management */}
            <Card className="w-64 flex-shrink-0">
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
        </div>

        {/* 2x2 Grid for Tables */}
        <div className="grid grid-cols-2 gap-4 mx-auto px-6" style={{ maxWidth: '1600px' }}>
          {/* Top Left - Users */}
          <Card className="flex flex-col border-2 h-[550px] max-w-[750px]">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Click a user to view their statistics</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4">
                <Button 
                  onClick={handleUnselectUser} 
                  variant="outline" 
                  size="sm"
                  disabled={!selectedUser}
                >
                  Unselect User
                </Button>
              </div>
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
                          className={`cursor-pointer ${selectedUser?.username === user.username ? 'bg-accent' : 'hover:bg-muted'}`}
                          onClick={() => handleSelectUser(user)}
                        >
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.programsLoaded || 0}</TableCell>
                          <TableCell>{user.functionsLoaded || 0}</TableCell>
                          <TableCell>{user.credits || 0}</TableCell>
                          <TableCell>{user.creditsUsed || 0}</TableCell>
                          <TableCell>{user.programExecutionsCounter || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Right - Programs */}
          <Card className="flex flex-col border-2 h-[550px] max-w-[750px]">
            <CardHeader>
              <CardTitle>Programs</CardTitle>
              <CardDescription>Available programs</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4">
                <Button 
                  onClick={handleExecuteProgram} 
                  variant="default" 
                  size="sm"
                  disabled={!selectedProgram}
                >
                  Execute Program
                </Button>
              </div>
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
                        <TableRow 
                          key={index}
                          className={`cursor-pointer ${selectedProgram?.programName === program.programName ? 'bg-accent' : 'hover:bg-muted'}`}
                          onClick={() => setSelectedProgram(selectedProgram?.programName === program.programName ? null : program)}
                        >
                          <TableCell className="font-medium">{program.programName || 'Unknown'}</TableCell>
                          <TableCell>{program.uploadingUser || 'N/A'}</TableCell>
                          <TableCell>{program.programInstructions?.length || 0}</TableCell>
                          <TableCell>{program.absoluteMaxExpandLevel || 0}</TableCell>
                          <TableCell>{program.numberOfRuns || 0}</TableCell>
                          <TableCell>{program.avarageCreditsPerRun?.toFixed(2) || '0.00'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Left - User Statistics */}
          <Card className="flex flex-col border-2 h-[550px] max-w-[750px]">
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>
                {selectedUser ? `Execution history for ${selectedUser.username}` : 'Select a user to view statistics'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {executionHistory.length > 0 ? (
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executionHistory.map((exec, index) => (
                        <TableRow key={index}>
                          <TableCell>{exec.runID || index + 1}</TableCell>
                          <TableCell>{exec.programType || 'Program'}</TableCell>
                          <TableCell className="font-medium">{exec.programName || 'N/A'}</TableCell>
                          <TableCell>{exec.architectureGeneration || 'N/A'}</TableCell>
                          <TableCell>{exec.expansionLevel || 0}</TableCell>
                          <TableCell>{exec.yValue || 0}</TableCell>
                          <TableCell>{exec.runCycles || 0}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleShowVariables(exec)} 
                                variant="outline" 
                                size="sm"
                              >
                                Show
                              </Button>
                              <Button 
                                onClick={() => handleRerun(exec)} 
                                variant="secondary" 
                                size="sm"
                              >
                                Rerun
                              </Button>
                            </div>
                          </TableCell>
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
          <Card className="flex flex-col border-2 h-[550px] max-w-[750px]">
            <CardHeader>
              <CardTitle>Functions</CardTitle>
              <CardDescription>Available functions</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4">
                <Button 
                  onClick={handleExecuteFunction} 
                  variant="default" 
                  size="sm"
                  disabled={!selectedFunction}
                >
                  Execute Function
                </Button>
              </div>
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
                        <TableRow 
                          key={index}
                          className={`cursor-pointer ${selectedFunction?.programName === func.programName ? 'bg-accent' : 'hover:bg-muted'}`}
                          onClick={() => setSelectedFunction(selectedFunction?.programName === func.programName ? null : func)}
                        >
                          <TableCell className="font-medium">{func.programName || 'Unknown'}</TableCell>
                          <TableCell>{func.originProgramName || 'N/A'}</TableCell>
                          <TableCell>{func.uploadingUser || 'N/A'}</TableCell>
                          <TableCell>{func.programInstructions?.length || 0}</TableCell>
                          <TableCell>{func.absoluteMaxExpandLevel || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Variables Popup with Overlay */}
        {showVariablesPopup && (
          <>
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in" 
              onClick={() => setShowVariablesPopup(false)}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
            >
            <Card 
              className="w-96 max-h-[80vh] overflow-auto shadow-2xl animate-scale-in" 
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle>Final State of Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedRunVariables && sortVariables(selectedRunVariables).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-border">
                      <span className="font-medium">{key}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button onClick={() => setShowVariablesPopup(false)} className="w-full">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
