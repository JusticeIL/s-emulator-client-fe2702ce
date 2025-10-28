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
import { Loader2, Play, RotateCcw, ArrowLeft } from "lucide-react";

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
  const [showSlowWarning, setShowSlowWarning] = useState(false);
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
        setProgram({...data, currentCycles: 0});
        
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
      setProgram({...updatedProgram, currentCycles: 0});
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

      // Validate arguments are non-negative integers
      const invalidArgs = programArgs.filter(arg => {
        const num = parseInt(arg.value, 10);
        return isNaN(num) || num < 0 || !Number.isInteger(parseFloat(arg.value));
      });

      if (invalidArgs.length > 0) {
        toast({
          title: "Invalid Arguments",
          description: `Arguments must be non-negative integers: ${invalidArgs.map(a => a.name).join(', ')}`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setExecuting(true);
      setShowSlowWarning(false);
      
      // Show warning after 30 seconds
      const warningTimeout = setTimeout(() => {
        setShowSlowWarning(true);
      }, 30000);
      
      // Build arguments as array of VariableDTO objects
      const argumentsSet = programArgs.map(arg => ({
        name: arg.name,
        value: arg.value
      }));
      
      const result = await executeProgram(argumentsSet, selectedArchitecture);
      clearTimeout(warningTimeout);
      setShowSlowWarning(false);
      setProgram(result);
      
      // Update credits after successful execution
      try {
        const userData = await fetchUser(username);
        setCurrentUserCredits(userData.credits || 0);
      } catch (error) {
        console.error('Failed to refresh user credits:', error);
      }
      
      toast({
        title: "Execution Complete",
        description: `Program finished in ${result.currentCycles} cycles`,
      });
      setExecuting(false);
    } catch (error) {
      setExecuting(false);
      setShowSlowWarning(false);
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
    <div className="min-h-screen bg-background p-6">
      {/* Top Bar */}
      <div className="max-w-[1800px] mx-auto mb-[50px]">
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '45% 20% 20%',
            gap: '7.5%',
          }}
        >
          {/* Left: Username */}
          <div>
            <p className="text-foreground">{username}</p>
          </div>
          
          {/* Middle: Title and Program Name */}
          <div className="text-center col-span-1">
            <h1 className="text-3xl font-bold">S-emulator Execution</h1>
            <p className="text-muted-foreground mt-1">{program?.programName || "Program Name"}</p>
          </div>
          
          {/* Right: Available Credits and Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Available Credits: </span>
              <span className="font-semibold text-primary">{currentUserCredits}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto h-[calc(100vh-180px)]">
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '45% 20% 20%',
            gap: '7.5%',
            height: '100%',
          }}
        >
          {/* Left Column (45%) - Instructions Table */}
          <div className="flex flex-col h-full">
            {/* Expansion Level Selection */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Label className="text-sm">Expansion Level:</Label>
              <Select 
                value={expansionLevel.toString()} 
                onValueChange={(val) => handleExpansionLevelChange(parseInt(val))}
                disabled={expanding || executing}
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

            {/* Instructions Table */}
            <Card className="flex-1 flex flex-col overflow-hidden" style={{ maxHeight: '700px', height: '700px' }}>
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
                            // Mark in red if instruction requires higher architecture than selected
                            const isIncompatibleWithSelected = instruction.ArchitectureGeneration && 
                              selectedArchitecture && 
                              compareArchitectures(instruction.ArchitectureGeneration, selectedArchitecture) > 0;
                            
                            const textColorClass = isIncompatibleWithSelected ? 'text-red-500' : '';
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className={`font-mono text-xs ${textColorClass}`}>{index + 1}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-xs ${textColorClass}`}>
                                    {instruction.type || 'S'}
                                  </Badge>
                                </TableCell>
                                <TableCell className={`text-xs ${textColorClass}`}>{instruction.label.name}</TableCell>
                                <TableCell className={`font-mono text-xs ${textColorClass}`}>
                                  {instruction.instruction}
                                </TableCell>
                                <TableCell className={`text-xs ${textColorClass}`}>{instruction.cycles || '0'}</TableCell>
                                <TableCell className={`text-xs ${textColorClass}`}>{instruction.ArchitectureGeneration || 'IV'}</TableCell>
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

            {/* Summary Lines */}
            <div className="border-t bg-muted/30 px-4 py-2 mt-2.5 flex flex-col justify-center">
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

          {/* Middle Column (20%) - Buttons, Variables, Cycles */}
          <div className="flex flex-col h-full gap-4">
            {/* Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Reset arguments
                  if (program?.programXArguments && Array.isArray(program.programXArguments)) {
                    setProgramArgs(program.programXArguments.map(arg => ({ name: arg, value: '' })));
                  }
                  // Reset variables to 0
                  if (program?.programVariablesCurrentState && Array.isArray(program.programVariablesCurrentState)) {
                    const resetVariables = program.programVariablesCurrentState.map(v => ({ ...v, value: '0' }));
                    setProgram(prev => ({ ...prev, programVariablesCurrentState: resetVariables, currentCycles: 0 }));
                  }
                }}
                disabled={executing}
                className="flex-1"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Setup New Run
              </Button>
              <Button 
                size="sm"
                onClick={handleStartExecution} 
                disabled={executing || !isArchitectureCompatible()}
                className="flex-1 transition-all disabled:opacity-100"
                style={{ 
                  backgroundColor: executing ? '#d97706' : (!isArchitectureCompatible() ? '#3a5a35' : '#72aa6c'),
                  color: 'white',
                  border: executing ? 'none' : '2px solid #72aa6c'
                }}
                onMouseEnter={(e) => {
                  if (!executing && isArchitectureCompatible()) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#72aa6c';
                    e.currentTarget.style.border = '2px solid #72aa6c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!executing && isArchitectureCompatible()) {
                    e.currentTarget.style.backgroundColor = '#72aa6c';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.border = '2px solid #72aa6c';
                  }
                }}
              >
                {executing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" style={{ color: 'white' }} />
                    <span style={{ color: 'white' }}>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Run
                  </>
                )}
              </Button>
            </div>

            {/* Variables Table */}
            <Card className="flex-1 flex flex-col overflow-hidden" style={{ maxHeight: '700px', height: '700px' }}>
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

            {/* Cycles */}
            <div className="flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Cycles: {program?.currentCycles || 0}</p>
            </div>
          </div>

          {/* Right Column (20%) - Architecture, Arguments, Back Button */}
          <div className="flex flex-col h-full gap-4">
            {/* Architecture Selection */}
            <Card className="flex items-center">
              <CardContent className="w-full p-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Architecture:</Label>
                  <Select value={selectedArchitecture} onValueChange={setSelectedArchitecture} disabled={executing}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Architecture" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARCHITECTURE_GENERATIONS.map(arch => (
                        <SelectItem key={arch} value={arch} className="text-xs">
                          {arch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!isArchitectureCompatible() && (
                  <p className="text-xs text-destructive mt-2">
                    Requires Architecture {program?.minimalArchitectureNeededForRun}+
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Arguments Table */}
            <Card className="flex-1 flex flex-col overflow-hidden" style={{ maxHeight: '700px', height: '700px' }}>
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
                                  type="number"
                                  value={arg.value}
                                  onChange={(e) => handleArgChange(index, e.target.value)}
                                  placeholder="0"
                                  className="h-7 text-xs"
                                  disabled={executing}
                                  min="0"
                                  step="1"
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

            {/* Back Button */}
            <div className="flex items-center justify-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Slow Request Warning */}
      {showSlowWarning && (
        <div className="fixed bottom-4 right-4 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md border-2 border-orange-600">
          <p className="text-sm font-semibold">Request is taking longer than expected...</p>
          <p className="text-xs mt-1">Please wait while we process your program execution</p>
        </div>
      )}
    </div>
  );
}
