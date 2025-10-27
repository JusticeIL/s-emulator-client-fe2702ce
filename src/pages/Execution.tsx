import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  fetchProgram,
  startExecution,
  fetchExecutionState,
  stopExecution,
  getUsernameCookie,
  type Program,
  type ExecutionState,
  type Instruction,
} from '@/lib/api';
import { ArrowLeft, Play, Square, Loader2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const Execution = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const programName = searchParams.get('program');

  const [program, setProgram] = useState<Program | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pollingInterval = useRef<number | null>(null);

  useEffect(() => {
    const user = getUsernameCookie();
    if (!user) {
      navigate('/');
      return;
    }

    if (!programName) {
      toast.error('No program specified');
      navigate('/dashboard');
      return;
    }

    loadProgram();

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [programName, navigate]);

  const loadProgram = async () => {
    if (!programName) return;

    setIsLoading(true);
    try {
      const data = await fetchProgram(programName);
      setProgram(data);
    } catch (error) {
      toast.error('Failed to load program');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = () => {
    pollingInterval.current = window.setInterval(async () => {
      try {
        const state = await fetchExecutionState();
        setExecutionState(state);

        if (state.finished) {
          handleStop();
          toast.success('Program execution completed');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleRun = async () => {
    if (!programName) return;

    try {
      setIsExecuting(true);
      await startExecution(programName);
      toast.success('Execution started');
      startPolling();
    } catch (error) {
      toast.error('Failed to start execution');
      setIsExecuting(false);
      console.error(error);
    }
  };

  const handleStop = async () => {
    try {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      await stopExecution();
      setIsExecuting(false);
      toast.info('Execution stopped');
    } catch (error) {
      console.error('Stop error:', error);
      setIsExecuting(false);
    }
  };

  const isInstructionCompatible = (instruction: Instruction): boolean => {
    if (!executionState?.architectureCompatible && !program?.architectureCompatible) {
      return true; // If no compatibility info, assume compatible
    }
    const compatibleOpcodes = executionState?.architectureCompatible || program?.architectureCompatible || [];
    return compatibleOpcodes.includes(instruction.opcode);
  };

  const instructions = executionState?.instructions || program?.instructions || [];
  const variables = executionState?.variables || program?.variables || {};
  const currentInstructionId = executionState?.currentInstructionId;
  const cycleCounter = executionState?.cycleCounter || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-mono">{programName}</h1>
              <p className="text-sm text-muted-foreground">Program Execution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isExecuting ? (
              <Button onClick={handleRun} className="gap-2">
                <Play className="h-4 w-4" />
                Run Program
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        {isExecuting && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary executing-pulse" />
                  <span className="font-semibold">Executing</span>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-muted-foreground">Instruction: </span>
                    <span className="font-mono font-semibold">{currentInstructionId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Cycles: </span>
                    <span className="font-mono font-semibold">{cycleCounter}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>
              Green indicates compatible with current architecture, red indicates incompatible
            </CardDescription>
          </CardHeader>
          <CardContent>
            {instructions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No instructions available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">#</th>
                      <th className="text-left py-3 px-4 font-semibold">Label</th>
                      <th className="text-left py-3 px-4 font-semibold">Opcode</th>
                      <th className="text-left py-3 px-4 font-semibold">Operands</th>
                      <th className="text-right py-3 px-4 font-semibold">Cycles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructions.map((instruction) => {
                      const isCompatible = isInstructionCompatible(instruction);
                      const isCurrent = instruction.id === currentInstructionId;

                      return (
                        <tr
                          key={instruction.id}
                          className={cn(
                            'border-b border-border/50 transition-all',
                            isCompatible ? 'instruction-compatible' : 'instruction-incompatible',
                            isCurrent && 'ring-2 ring-primary shadow-lg'
                          )}
                        >
                          <td className="py-3 px-4 font-mono font-semibold">{instruction.id}</td>
                          <td className="py-3 px-4 font-mono">{instruction.label || '-'}</td>
                          <td className="py-3 px-4 font-mono font-semibold">{instruction.opcode}</td>
                          <td className="py-3 px-4 font-mono">{instruction.operands.join(', ')}</td>
                          <td className="py-3 px-4 text-right font-mono">{instruction.cycles}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variables */}
        {Object.keys(variables).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Variables</CardTitle>
              <CardDescription>Current variable states</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-lg bg-muted border border-border">
                    <div className="text-sm text-muted-foreground">{key}</div>
                    <div className="text-lg font-mono font-semibold">{String(value)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Execution;
