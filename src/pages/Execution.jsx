import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchActiveProgram, executeProgram, getUsernameCookie } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, ArrowLeft, Play } from "lucide-react";

export default function Execution() {
  const [program, setProgram] = useState(null);
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
    try {
      setExecuting(true);
      const result = await executeProgram({}, program.minimalArchitectureNeededForRun || 'GEN_A');
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
        description: "Failed to execute program",
        variant: "destructive",
      });
    }
  };

  const isInstructionCompatible = (instruction) => {
    const compatible = program?.minimalArchitectureNeededForRun || [];
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
              <h1 className="text-3xl font-bold">{program?.programName}</h1>
              {program?.minimalArchitectureNeededForRun && (
                <p className="text-muted-foreground mt-1">
                  Architecture: {program.minimalArchitectureNeededForRun}
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
