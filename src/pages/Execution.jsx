import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { fetchActiveProgram, executeProgram, getUsernameCookie, fetchUser, ARCHITECTURE_GENERATIONS, compareArchitectures } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, Play, RotateCcw } from "lucide-react";

export default function Execution() {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedArchitecture, setSelectedArchitecture] = useState('IV');
  const [programArgs, setProgramArgs] = useState({});
  const [username, setUsername] = useState("");
  const [currentUserCredits, setCurrentUserCredits] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = getUsernameCookie();
    if (!user) {
      navigate("/");
      return;
    }
    setUsername(user);

    const loadUserCredits = async () => {
      try {
        const userData = await fetchUser(user);
        setCurrentUserCredits(userData.credits || 0);
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
      }
    };

    const loadProgram = async () => {
      try {
        const data = await fetchActiveProgram();
        if (!data) {
          toast({
            title: "No Program",
            description: "No active program selected",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        setProgram(data);
        
        // Set default architecture to program's required arch or highest available
        if (data.minimalArchitectureNeededForRun) {
          setSelectedArchitecture(data.minimalArchitectureNeededForRun);
        }
        
        // Initialize program arguments with empty values
        if (data.arguments) {
          const initialArgs = {};
          Object.keys(data.arguments).forEach(argName => {
            initialArgs[argName] = '';
          });
          setProgramArgs(initialArgs);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load program",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadUserCredits();
    loadProgram();
  }, [navigate, toast]);

  const handleStartExecution = async () => {
    // Validate required arguments
    if (program?.arguments) {
      const missingArgs = Object.keys(program.arguments).filter(
        argName => !programArgs[argName] || programArgs[argName].trim() === ''
      );
      
      if (missingArgs.length > 0) {
        toast({
          title: "Missing Arguments",
          description: `Please provide values for: ${missingArgs.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setExecuting(true);
      const result = await executeProgram(programArgs, selectedArchitecture);
      setProgram(result);
      toast({
        title: "Execution Complete",
        description: `Program finished in ${result.currentCycles} cycles`,
      });
      setExecuting(false);
    } catch (error) {
      setExecuting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to execute program",
        variant: "destructive",
      });
    }
  };

  const isInstructionCompatible = (instruction) => {
    if (!instruction.architecture || !selectedArchitecture) return true;
    // Instruction is compatible if its required architecture <= selected architecture
    return compareArchitectures(instruction.architecture, selectedArchitecture) <= 0;
  };

  const handleArgChange = (argName, value) => {
    setProgramArgs(prev => ({
      ...prev,
      [argName]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-card">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Left: Username */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{username}</span>
              <span className="text-sm text-muted-foreground">Username</span>
            </div>
            
            {/* Center: Program Name */}
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold">Divide</h1>
              <p className="text-sm text-primary">{program?.programName || "Program Name"}</p>
            </div>
            
            {/* Right: Available Credits + Theme Toggle */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Available Credits: </span>
                <span className="text-sm font-semibold text-primary">{currentUserCredits}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Grid */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left Column - Instructions Table */}
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
              {!program?.instructions || program.instructions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No instructions available</p>
              ) : (
                <>
                  <ScrollArea className="flex-1">
                    <div className="px-6">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead className="w-16">Type</TableHead>
                            <TableHead className="w-24">Label</TableHead>
                            <TableHead className="flex-1">Instruction</TableHead>
                            <TableHead className="w-20">Cycles</TableHead>
                            <TableHead className="w-28">Architecture</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {program.instructions.map((instruction, index) => {
                            const isCurrent = program.currentLine === index + 1;
                            const compatible = isInstructionCompatible(instruction);
                            
                            return (
                              <TableRow
                                key={index}
                                className={`
                                  ${isCurrent ? 'bg-primary/20 border-l-4 border-l-primary' : ''}
                                  ${!compatible ? 'instruction-incompatible' : ''}
                                `}
                              >
                                <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {instruction.type || 'S'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs">{instruction.label || '-'}</TableCell>
                                <TableCell className="font-mono text-xs">{instruction.instruction || instruction.opcode || '-'}</TableCell>
                                <TableCell className="text-xs">{instruction.cycles || '0'}</TableCell>
                                <TableCell className="text-xs">{instruction.architecture || 'IV'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                  
                  {/* Info Line at Bottom */}
                  <div className="border-t px-6 py-3 flex-shrink-0 bg-muted/30">
                    <p className="text-xs text-muted-foreground text-center">
                      {program.instructions.length > 0 && (
                        <>
                          Program contains {program.instructions.filter(i => i.type === 'B').length} Basic Instructions, {program.instructions.filter(i => i.type === 'S').length} Synthetic Instructions,{' '}
                          {program.instructions.filter(i => i.architecture === 'III' || i.architecture === 'IV').length} Instructions in Architecture III, {program.instructions.filter(i => i.architecture === 'II' || i.architecture === 'III' || i.architecture === 'IV').length} Instructions in Architecture II and {program.instructions.length} Instructions in Architecture I.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Variables, Architecture, Arguments */}
          <div className="flex flex-col gap-4 h-full">
            {/* Buttons at Top */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                // Reset args
                if (program?.arguments) {
                  const initialArgs = {};
                  Object.keys(program.arguments).forEach(argName => {
                    initialArgs[argName] = '';
                  });
                  setProgramArgs(initialArgs);
                }
              }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Setup New Run
              </Button>
              <Button 
                onClick={handleStartExecution} 
                disabled={executing}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                {executing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </>
                )}
              </Button>
            </div>

            {/* Variables Table */}
            {program?.variables && Object.keys(program.variables).length > 0 && (
              <Card className="flex-shrink-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(program.variables).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-mono text-sm">{key}</TableCell>
                          <TableCell className="font-mono text-sm">{value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Architecture Selection */}
            <Card className="flex-shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Architecture Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedArchitecture} onValueChange={setSelectedArchitecture}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select architecture" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARCHITECTURE_GENERATIONS.map(arch => (
                      <SelectItem key={arch} value={arch}>
                        Architecture {arch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {program?.minimalArchitectureNeededForRun && (
                    <>Required: {program.minimalArchitectureNeededForRun}</>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Arguments Table */}
            {program?.arguments && Object.keys(program.arguments).length > 0 && (
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-base">Argument Name</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Argument Name</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(program.arguments).map(([argName, argType]) => (
                        <TableRow key={argName}>
                          <TableCell className="font-mono text-sm">
                            {argName}
                            <span className="text-xs text-muted-foreground ml-2">({argType})</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={programArgs[argName] || ''}
                              onChange={(e) => handleArgChange(argName, e.target.value)}
                              placeholder="0"
                              className="h-8 text-sm"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Cycles Display */}
            {program?.currentCycles !== undefined && (
              <div className="flex-shrink-0 text-center py-2">
                <p className="text-sm text-muted-foreground">Cycles: {program.currentCycles}</p>
              </div>
            )}
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="px-8"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
