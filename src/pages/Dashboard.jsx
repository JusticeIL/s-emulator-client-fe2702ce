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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">S-Emulator Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome, {username}</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Credit Management */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Management</CardTitle>
            <CardDescription>Add credits to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 max-w-sm">
              <Input
                type="number"
                placeholder="Enter amount"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                min="1"
              />
              <Button onClick={handleAddCredits} disabled={addingCredits}>
                {addingCredits && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Programs */}
          <Card>
            <CardHeader>
              <CardTitle>Available Programs</CardTitle>
              <CardDescription>Uploaded programs</CardDescription>
            </CardHeader>
            <CardContent>
              {programs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No programs available</p>
              ) : (
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Cycles</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((program, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{program.programName || 'Unknown'}</TableCell>
                          <TableCell>{program.maxProgramLevel || 0}</TableCell>
                          <TableCell>{program.currentCycles || 0}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => handleRunProgram(program.programName)}
                            >
                              Run
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Functions */}
          <Card>
            <CardHeader>
              <CardTitle>Available Functions</CardTitle>
              <CardDescription>Uploaded functions</CardDescription>
            </CardHeader>
            <CardContent>
              {functions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No functions available</p>
              ) : (
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Cycles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {functions.map((func, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{func.programName || 'Unknown'}</TableCell>
                          <TableCell>{func.maxProgramLevel || 0}</TableCell>
                          <TableCell>{func.currentCycles || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Users</CardTitle>
              <CardDescription>Click a user to view statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users connected</p>
              ) : (
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Credits</TableHead>
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
                          <TableCell>{user.credits || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>
                {selectedUser ? `Details for ${selectedUser.username}` : 'Select a user to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Username:</span>
                    <span>{selectedUser.username}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Credits:</span>
                    <span>{selectedUser.credits || 0}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Active Program:</span>
                    <span>{selectedUser.activeProgram || 'None'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Max Level:</span>
                    <span>{selectedUser.maxProgramLevel || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Current Cycles:</span>
                    <span>{selectedUser.currentCycles || 0}</span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Click on a user from the table to view their statistics
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
