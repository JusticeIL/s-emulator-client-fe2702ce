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
import { fetchActiveProgram, executeProgram, getUsernameCookie, fetchUser, ARCHITECTURE_GENERATIONS, compareArchitectures, expandProgram } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, Play, RotateCcw } from "lucide-react";

export default function Execution() {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedArchitecture, setSelectedArchitecture] = useState('IV');
  const [programArgs, setProgramArgs] = useState([]);
  const [expansionLevel, setExpansionLevel] = useState(0);
  const [username, setUsername] = useState("");
  const [currentUserCredits, setCurrentUserCredits] = useState(0);
  const [expanding, setExpanding] = useState(false);
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
        if (data.programXArguments && Array.isArray(data.programXArguments)) {
          setProgramArgs(data.programXArguments.map(arg => ({ name: arg, value: '' })));
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

  const handleExpansionLevelChange = async (level) => {
    try {
      setExpanding(true);
      const updatedProgram = await expandProgram(level);
      setProgram(updatedProgram);
      setExpansionLevel(level);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to expand program",
        variant: "destructive",
      });
    } finally {
      setExpanding(false);
    }
  };

  const handleStartExecution = async () => {
    // Validate architecture compatibility
    if (program?.minimalArchitectureNeededForRun && 
        compareArchitectures(selectedArchitecture, program.minimalArchitectureNeededForRun) < 0) {
      toast({
        title: "Incompatible Architecture",
        description: `This program requires at least Architecture ${program.minimalArchitectureNeededForRun}`,
        variant: "destructive",
      });
      return;
    }

    // Validate required arguments
    if (programArgs && programArgs.length > 0) {
      const missingArgs = programArgs.filter(arg => !arg.value || arg.value.trim() === '');
      
      if (missingArgs.length > 0) {
        toast({
          title: "Missing Arguments",
          description: `Please provide values for: ${missingArgs.map(a => a.name).join(', ')}`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setExecuting(true);
      const argsObj = {};
      programArgs.forEach(arg => {
        argsObj[arg.name] = arg.value;
      });
      const result = await executeProgram(argsObj, selectedArchitecture);
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
    if (!instruction.ArchitectureGeneration || !selectedArchitecture) return true;
    return compareArchitectures(instruction.ArchitectureGeneration, selectedArchitecture) <= 0;
  };

  const handleArgChange = (index, value) => {
    setProgramArgs(prev => {
      const newArgs = [...prev];
      newArgs[index] = { ...newArgs[index], value };
      return newArgs;
    });
  };

  const isArchitectureCompatible = () => {
    if (!program?.minimalArchitectureNeededForRun) return true;
    return compareArchitectures(selectedArchitecture, program.minimalArchitectureNeededForRun) >= 0;
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
          <div className="flex justify-between items-center mb-2">
            {/* Left: Username */}
            <div className="text-sm text-muted-foreground">
              User: <span className="font-semibold">{username}</span>
            </div>
            
            {/* Center: Title */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">S-emulator Execution</h1>
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
          
          {/* Program Name */}
          <div className="text-center">
            <h2 className="text-base font-medium">{program?.programName || "Program Name"}</h2>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6 h-[calc(100vh-180px)]">
        <div className="grid grid-cols-[45%_45%] gap-[10%] h-full">
          {/* Left Column - Instructions Table */}
          <div className="flex flex-col h-full">
            {/* Expansion Level Selection - 5% */}
            <div className="h-[5%] flex items-center justify-center gap-4 mb-2">
              <Label className="text-sm">Expansion Level:</Label>
              <Select 
                value={expansionLevel.toString()} 
                onValueChange={(val) => handleExpansionLevelChange(parseInt(val))}
                disabled={expanding}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: (program?.absoluteMaxExpandLevel || 0) + 1 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">Max: {program?.absoluteMaxExpandLevel || 0}</span>
              {expanding && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>

            {/* Instructions Table - 90% */}
            <Card className="flex-1 h-[90%] flex flex-col overflow-hidden">
              <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                {!program?.programInstructions || program.programInstructions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No instructions available</p>
                ) : (
                  <ScrollArea className="flex-1">
                    <div className="px-6 pt-6">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead className="w-16">Type</TableHead>
                            <TableHead className="w-24">Label</TableHead>
                            <TableHead>Instruction</TableHead>
                            <TableHead className="w-20">Cycles</TableHead>
                            <TableHead className="w-28">Architecture</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {program.programInstructions.map((instruction, index) => {
                            const compatible = isInstructionCompatible(instruction);
                            
                            return (
                              <TableRow
                                key={index}
                                className={!compatible ? 'opacity-50' : ''}
                              >
                                <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {instruction.type || 'S'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs">{instruction.label.name}</TableCell>
                                <TableCell className="font-mono text-xs">{instruction.instruction}</TableCell>
                                <TableCell className="text-xs">{instruction.cycles || '0'}</TableCell>
                                <TableCell className="text-xs">{instruction.ArchitectureGeneration || 'IV'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Summary Lines - 5% */}
            <div className="h-[5%] border-t bg-muted/30 px-4 flex flex-col justify-center">
              {program?.programInstructions && program.programInstructions.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground text-center">
                    Program contains {program.programInstructions.filter(i => i.type === 'B').length} Basic Instructions, {program.programInstructions.filter(i => i.type === 'S').length} Synthetic Instructions,
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {program.programInstructions.filter(i => i.ArchitectureGeneration === 'IV').length} Instructions in Architecture IV, {program.programInstructions.filter(i => i.ArchitectureGeneration === 'III').length} Instructions in Architecture III, {program.programInstructions.filter(i => i.ArchitectureGeneration === 'II').length} Instructions in Architecture II and {program.programInstructions.filter(i => i.ArchitectureGeneration === 'I').length} Instructions in Architecture I.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Two Sub-Columns */}
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Left Sub-Column */}
            <div className="flex flex-col h-full">
              {/* Buttons - 5% */}
              <div className="h-[5%] flex gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (program?.programXArguments && Array.isArray(program.programXArguments)) {
                      setProgramArgs(program.programXArguments.map(arg => ({ name: arg, value: '' })));
                    }
                  }}
                  className="flex-1"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Setup New Run
                </Button>
                <Button 
                  size="sm"
                  onClick={handleStartExecution} 
                  disabled={executing || !isArchitectureCompatible()}
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground disabled:opacity-50"
                >
                  {executing ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </>
                  )}
                </Button>
              </div>

              {/* Variables Table - 90% */}
              <Card className="flex-1 h-[90%] flex flex-col overflow-hidden">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-sm">Variables</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                  {program?.programVariablesCurrentState && program.programVariablesCurrentState.length > 0 ? (
                    <ScrollArea className="h-full">
                      <div className="px-6 pb-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Name</TableHead>
                              <TableHead className="text-xs">Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...program.programVariablesCurrentState]
                              .sort((a, b) => {
                                const aName = a.name;
                                const bName = b.name;
                                
                                // Sort order: y, then x1, x2, ..., then z1, z2, ...
                                if (aName === 'y') return -1;
                                if (bName === 'y') return 1;
                                
                                const aIsX = aName.startsWith('x');
                                const bIsX = bName.startsWith('x');
                                const aIsZ = aName.startsWith('z');
                                const bIsZ = bName.startsWith('z');
                                
                                if (aIsX && !bIsX) return -1;
                                if (!aIsX && bIsX) return 1;
                                if (aIsZ && !bIsZ) return 1;
                                if (!aIsZ && bIsZ) return -1;
                                
                                // Both same type, sort numerically
                                const aNum = parseInt(aName.slice(1)) || 0;
                                const bNum = parseInt(bName.slice(1)) || 0;
                                return aNum - bNum;
                              })
                              .map((variable, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-mono text-xs">{variable.name}</TableCell>
                                  <TableCell className="font-mono text-xs">{variable.value}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground text-xs py-4">No variables</p>
                  )}
                </CardContent>
              </Card>

              {/* Cycles - 5% */}
              <div className="h-[5%] flex items-center justify-center mt-2">
                <p className="text-sm text-muted-foreground">Cycles: {program?.currentCycles || 0}</p>
              </div>
            </div>

            {/* Right Sub-Column */}
            <div className="flex flex-col h-full">
              {/* Architecture Selection - 5% */}
              <Card className="h-[5%] mb-2 flex items-center">
                <CardContent className="w-full p-3">
                  <Select value={selectedArchitecture} onValueChange={setSelectedArchitecture}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Architecture" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARCHITECTURE_GENERATIONS.map(arch => (
                        <SelectItem key={arch} value={arch} className="text-xs">
                          Architecture {arch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Arguments Table - 90% */}
              <Card className="flex-1 h-[90%] flex flex-col overflow-hidden">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-sm">Arguments</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                  {programArgs && programArgs.length > 0 ? (
                    <ScrollArea className="h-full">
                      <div className="px-6 pb-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Argument Name</TableHead>
                              <TableHead className="text-xs">Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {programArgs.map((arg, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-xs">{arg.name}</TableCell>
                                <TableCell>
                                  <Input
                                    type="text"
                                    value={arg.value}
                                    onChange={(e) => handleArgChange(index, e.target.value)}
                                    placeholder="0"
                                    className="h-7 text-xs"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground text-xs py-4">No arguments required</p>
                  )}
                </CardContent>
              </Card>

              {/* Back to Dashboard - 5% */}
              <div className="h-[5%] flex items-center justify-center mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
              
              {/* Architecture Warning */}
              {!isArchitectureCompatible() && (
                <p className="text-xs text-destructive text-center mt-1">
                  Requires Architecture {program?.minimalArchitectureNeededForRun}+
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
