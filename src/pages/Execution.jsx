import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchProgram, startExecution, fetchExecutionState, stopExecution, getUsernameCookie } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, ArrowLeft, Play, Square } from "lucide-react";

export default function Execution() {
  const [searchParams] = useSearchParams();
  const programName = searchParams.get("program");
  const [program, setProgram] = useState(null);
  const [executionState, setExecutionState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = getUsernameCookie();
    if (!user) {
      navigate("/");
      return;
    }

    if (!programName) {
      navigate("/dashboard");
      return;
    }

    const loadProgram = async () => {
      try {
        const data = await fetchProgram(programName);
        setProgram(data);
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
  }, [programName, navigate, toast]);

  useEffect(() => {
    let interval;
    if (executing) {
      interval = setInterval(async () => {
        try {
          const state = await fetchExecutionState();
          setExecutionState(state);
          
          if (state.finished) {
            setExecuting(false);
            toast({
              title: "Execution Complete",
              description: `Program finished with ${state.cycleCounter || 0} cycles`,
            });
          }
        } catch (error) {
          console.error("Failed to fetch execution state:", error);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [executing, toast]);

  const handleStartExecution = async () => {
    try {
      await startExecution(programName);
      setExecuting(true);
      toast({
        title: "Execution Started",
        description: "Program is now running",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start execution",
        variant: "destructive",
      });
    }
  };

  const handleStopExecution = async () => {
    try {
      await stopExecution();
      setExecuting(false);
      toast({
        title: "Execution Stopped",
        description: "Program execution has been stopped",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop execution",
        variant: "destructive",
      });
    }
  };

  const isInstructionCompatible = (instruction) => {
    const compatible = executionState?.architectureCompatible || program?.architectureCompatible || [];
    return compatible.includes(instruction.opcode);
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
              <h1 className="text-3xl font-bold">{programName}</h1>
              {program?.architectureGeneration && (
                <p className="text-muted-foreground mt-1">
                  Architecture: {program.architectureGeneration}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            {!executing ? (
              <Button onClick={handleStartExecution}>
                <Play className="h-4 w-4 mr-2" />
                Run Program
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleStopExecution}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {executing && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary executing-pulse" />
                <div className="flex-1">
                  <p className="font-medium">Executing...</p>
                  <p className="text-sm text-muted-foreground">
                    Current Instruction: {executionState?.currentInstructionId || 'N/A'} | 
                    Cycles: {executionState?.cycleCounter || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {executionState?.variables && (
          <Card>
            <CardHeader>
              <CardTitle>Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(executionState.variables).map(([key, value]) => (
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
                  {program.instructions.map((instruction) => {
                    const isCurrent = executionState?.currentInstructionId === instruction.id;
                    const compatible = isInstructionCompatible(instruction);
                    
                    return (
                      <TableRow
                        key={instruction.id}
                        className={`
                          ${isCurrent ? 'bg-primary/20 border-l-4 border-l-primary' : ''}
                          ${compatible ? 'instruction-compatible' : 'instruction-incompatible'}
                        `}
                      >
                        <TableCell className="font-medium">{instruction.id}</TableCell>
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
