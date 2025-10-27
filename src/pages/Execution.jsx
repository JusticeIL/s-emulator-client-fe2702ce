import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchActiveProgram, executeProgram, getUsernameCookie, ARCHITECTURE_GENERATIONS, compareArchitectures } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, ArrowLeft, Play } from "lucide-react";

export default function Execution() {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedArchitecture, setSelectedArchitecture] = useState('IV');
  const [programArgs, setProgramArgs] = useState({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = getUsernameCookie();
    if (!user) {
      navigate("/");
      return;
    }

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{program?.programName}</h1>
              {program?.minimalArchitectureNeededForRun && (
                <p className="text-muted-foreground mt-1">
                  Required Architecture: {program.minimalArchitectureNeededForRun}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button onClick={handleStartExecution} disabled={executing}>
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Program
                </>
              )}
            </Button>
          </div>
        </div>

        {program?.status === 'running' && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary executing-pulse" />
                <div className="flex-1">
                  <p className="font-medium">Executing...</p>
                  <p className="text-sm text-muted-foreground">
                    Current Line: {program.currentLine || 0} | 
                    Cycles: {program.currentCycles || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Execution Configuration</CardTitle>
            <CardDescription>Configure architecture and program arguments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="architecture">Architecture Generation</Label>
              <Select value={selectedArchitecture} onValueChange={setSelectedArchitecture}>
                <SelectTrigger id="architecture" className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select architecture" />
                </SelectTrigger>
                <SelectContent>
                  {ARCHITECTURE_GENERATIONS.map(arch => (
                    <SelectItem key={arch} value={arch}>
                      Generation {arch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the architecture generation for execution (I &lt; II &lt; III &lt; IV)
              </p>
            </div>

            {program?.arguments && Object.keys(program.arguments).length > 0 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Program Arguments</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Provide values for the required program arguments
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(program.arguments).map(([argName, argType]) => (
                    <div key={argName} className="space-y-2">
                      <Label htmlFor={argName}>
                        {argName}
                        <span className="text-xs text-muted-foreground ml-2">({argType})</span>
                      </Label>
                      <Input
                        id={argName}
                        type="text"
                        value={programArgs[argName] || ''}
                        onChange={(e) => handleArgChange(argName, e.target.value)}
                        placeholder={`Enter ${argName}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {program?.variables && Object.keys(program.variables).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(program.variables).map(([key, value]) => (
                  <Badge key={key} variant="outline">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>Program execution instructions</CardDescription>
          </CardHeader>
          <CardContent>
            {!program?.instructions || program.instructions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No instructions available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Opcode</TableHead>
                    <TableHead>Operands</TableHead>
                    <TableHead>Cycles</TableHead>
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
                          ${compatible ? 'instruction-compatible' : 'instruction-incompatible'}
                        `}
                      >
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{instruction.label || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={compatible ? "default" : "destructive"}>
                            {instruction.opcode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {instruction.operands?.join(', ') || '-'}
                        </TableCell>
                        <TableCell>{instruction.cycles || 0}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
