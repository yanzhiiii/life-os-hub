import { useState, useEffect, useRef, useCallback } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTasks, useCreateTask, useDeleteTask, useUpdateTask } from "@/hooks/use-tasks";
import { useRoutines, useCreateRoutine, useRoutineCompletions, useLogRoutineCompletion } from "@/hooks/use-routines";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/use-goals";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, insertRoutineSchema, insertGoalSchema } from "@shared/schema";
import { z } from "zod";
import { CheckCircle2, Circle, Plus, Trash2, CalendarIcon, Target, Flame, CheckSquare, Timer, Play, Pause, RotateCcw, Coffee, Brain, Settings } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const taskSchema = insertTaskSchema.extend({
  priority: z.enum(["low", "medium", "high"]),
});

const routineSchema = z.object({
  title: z.string().min(1),
  steps: z.string().min(1),
  frequency: z.string().default("daily"),
});

const goalSchema = z.object({
  title: z.string().min(1),
  targetDate: z.string().optional(),
  milestones: z.string().optional(),
});

export default function Productivity() {
  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Productivity</h1>
          <p className="text-muted-foreground">Manage your tasks, routines, and long-term goals.</p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-tasks">
            <CheckSquare className="w-4 h-4 mr-2" />Tasks
          </TabsTrigger>
          <TabsTrigger value="routines" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-routines">
            <Flame className="w-4 h-4 mr-2" />Routines
          </TabsTrigger>
          <TabsTrigger value="goals" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-goals">
            <Target className="w-4 h-4 mr-2" />Goals
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-pomodoro">
            <Timer className="w-4 h-4 mr-2" />Pomodoro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TaskList />
        </TabsContent>

        <TabsContent value="routines" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <RoutineList />
        </TabsContent>

        <TabsContent value="goals" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GoalList />
        </TabsContent>
        
        <TabsContent value="pomodoro" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <PomodoroTimer />
        </TabsContent>
      </Tabs>
    </Shell>
  );
}

function TaskList() {
  const { data: tasks, isLoading } = useTasks();
  const { mutate: createTask } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", priority: "medium", status: "todo" }
  });

  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    createTask(data, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const toggleStatus = (task: any) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTask({ id: task.id, status: newStatus });
  };

  if (isLoading) return <div className="p-8 text-center">Loading tasks...</div>;

  const sortedTasks = tasks?.sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "done" ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" data-testid="button-new-task">
              <Plus className="w-4 h-4 mr-2" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <Input placeholder="What needs to be done?" {...form.register("title")} data-testid="input-task-title" />
              <div className="grid grid-cols-2 gap-4">
                <Select onValueChange={(v) => form.setValue("priority", v as any)} defaultValue="medium">
                  <SelectTrigger data-testid="select-task-priority">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" {...form.register("dueDate")} data-testid="input-task-due" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="button-save-task">Create Task</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {sortedTasks?.map((task) => (
          <div 
            key={task.id} 
            className={cn(
              "group flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border",
              task.status === "done" && "opacity-60 bg-secondary/30"
            )}
            data-testid={`card-task-${task.id}`}
          >
            <button onClick={() => toggleStatus(task)} className="text-muted-foreground hover:text-primary transition-colors" data-testid={`button-toggle-task-${task.id}`}>
              {task.status === "done" ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6" />}
            </button>
            
            <div className="flex-1">
              <h3 className={cn("font-medium text-lg", task.status === "done" && "line-through text-muted-foreground")}>
                {task.title}
              </h3>
              <div className="flex gap-2 mt-1">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  task.priority === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                  task.priority === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                )}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-xs flex items-center gap-1 text-muted-foreground">
                    <CalendarIcon className="w-3 h-3" />
                    {format(new Date(task.dueDate), "MMM d")}
                  </span>
                )}
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              onClick={() => deleteTask(task.id)}
              data-testid={`button-delete-task-${task.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {sortedTasks?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
            No tasks yet. Start by creating one!
          </div>
        )}
      </div>
    </div>
  );
}

function RoutineList() {
  const { data: routines, isLoading } = useRoutines();
  const { mutate: createRoutine } = useCreateRoutine();
  const { mutate: logCompletion } = useLogRoutineCompletion();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: completions } = useRoutineCompletions(today);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof routineSchema>>({
    resolver: zodResolver(routineSchema),
    defaultValues: { title: "", steps: "", frequency: "daily" }
  });

  const onSubmit = (data: z.infer<typeof routineSchema>) => {
    const steps = data.steps.split("\n").filter(s => s.trim());
    createRoutine({ title: data.title, steps, frequency: data.frequency }, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const getCompletionForRoutine = (routineId: number) => {
    return completions?.find(c => c.routineId === routineId);
  };

  const toggleStep = (routine: any, stepIndex: number) => {
    const existing = getCompletionForRoutine(routine.id);
    const completedSteps = existing?.completedSteps 
      ? [...existing.completedSteps] 
      : routine.steps.map(() => false);
    
    completedSteps[stepIndex] = !completedSteps[stepIndex];
    
    logCompletion({
      routineId: routine.id,
      date: today,
      completedSteps
    });
  };

  if (isLoading) return <div className="p-8 text-center">Loading routines...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/25" data-testid="button-new-routine">
              <Plus className="w-4 h-4 mr-2" /> New Routine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Routine</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <Input placeholder="Routine name (e.g., Morning Routine)" {...form.register("title")} data-testid="input-routine-title" />
              <Textarea 
                placeholder="Steps (one per line):&#10;Make bed&#10;Drink water&#10;Exercise" 
                className="min-h-[120px]"
                {...form.register("steps")} 
                data-testid="textarea-routine-steps"
              />
              <Select onValueChange={(v) => form.setValue("frequency", v)} defaultValue="daily">
                <SelectTrigger data-testid="select-routine-frequency">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full" data-testid="button-save-routine">Create Routine</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {routines?.map((routine) => {
          const completion = getCompletionForRoutine(routine.id);
          const completedCount = completion?.completedSteps?.filter(Boolean).length || 0;
          const progress = (completedCount / routine.steps.length) * 100;
          
          return (
            <Card key={routine.id} className="shadow-lg" data-testid={`card-routine-${routine.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      progress === 100 ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
                    )}>
                      <Flame className={cn(
                        "w-5 h-5",
                        progress === 100 ? "text-green-600" : "text-primary"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{routine.title}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{routine.frequency}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {completedCount}/{routine.steps.length}
                  </span>
                </div>
                <Progress value={progress} className="h-2 mt-3" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {routine.steps.map((step, idx) => {
                    const isCompleted = completion?.completedSteps?.[idx] || false;
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => toggleStep(routine, idx)}
                        data-testid={`step-${routine.id}-${idx}`}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          isCompleted 
                            ? "bg-green-500 border-green-500" 
                            : "border-border group-hover:border-primary"
                        )}>
                          {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <span className={cn(
                          "text-sm transition-colors",
                          isCompleted && "line-through text-muted-foreground"
                        )}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {routines?.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
            No routines yet. Create one to build healthy habits!
          </div>
        )}
      </div>
    </div>
  );
}

function GoalList() {
  const { data: goals, isLoading } = useGoals();
  const { mutate: createGoal } = useCreateGoal();
  const { mutate: updateGoal } = useUpdateGoal();
  const { mutate: deleteGoal } = useDeleteGoal();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: { title: "", targetDate: "", milestones: "" }
  });

  const onSubmit = (data: z.infer<typeof goalSchema>) => {
    const milestones = data.milestones?.split("\n").filter(s => s.trim()).map((text, i) => ({
      id: `m${i}`,
      text,
      completed: false
    })) || [];
    
    createGoal({ 
      title: data.title, 
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      milestones,
      completed: false
    }, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const toggleMilestone = (goal: any, milestoneId: string) => {
    const updatedMilestones = goal.milestones?.map((m: any) => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    updateGoal({ id: goal.id, milestones: updatedMilestones });
  };

  if (isLoading) return <div className="p-8 text-center">Loading goals...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/25" data-testid="button-new-goal">
              <Plus className="w-4 h-4 mr-2" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <Input placeholder="Goal title (e.g., Save $10,000)" {...form.register("title")} data-testid="input-goal-title" />
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Target Date (optional)</label>
                <Input type="date" {...form.register("targetDate")} data-testid="input-goal-date" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Milestones (one per line)</label>
                <Textarea 
                  placeholder="First milestone&#10;Second milestone&#10;Third milestone" 
                  className="min-h-[100px]"
                  {...form.register("milestones")} 
                  data-testid="textarea-goal-milestones"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-save-goal">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {goals?.map((goal) => {
          const completedMilestones = goal.milestones?.filter((m: any) => m.completed).length || 0;
          const totalMilestones = goal.milestones?.length || 0;
          const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
          
          return (
            <Card key={goal.id} className="shadow-lg" data-testid={`card-goal-${goal.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-xl",
                      goal.completed ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
                    )}>
                      <Target className={cn(
                        "w-6 h-6",
                        goal.completed ? "text-green-600" : "text-primary"
                      )} />
                    </div>
                    <div>
                      <CardTitle className={cn(goal.completed && "line-through text-muted-foreground")}>
                        {goal.title}
                      </CardTitle>
                      {goal.targetDate && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <CalendarIcon className="w-3 h-3" />
                          Target: {format(new Date(goal.targetDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {completedMilestones}/{totalMilestones}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteGoal(goal.id)}
                      data-testid={`button-delete-goal-${goal.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {totalMilestones > 0 && (
                  <Progress value={progress} className="h-2 mt-4" />
                )}
              </CardHeader>
              {totalMilestones > 0 && (
                <CardContent>
                  <div className="space-y-3">
                    {goal.milestones?.map((milestone: any) => (
                      <div 
                        key={milestone.id} 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => toggleMilestone(goal, milestone.id)}
                        data-testid={`milestone-${goal.id}-${milestone.id}`}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          milestone.completed 
                            ? "bg-green-500 border-green-500" 
                            : "border-border group-hover:border-primary"
                        )}>
                          {milestone.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <span className={cn(
                          "text-sm",
                          milestone.completed && "line-through text-muted-foreground"
                        )}>
                          {milestone.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {goals?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
            No goals yet. Set your first goal to stay focused!
          </div>
        )}
      </div>
    </div>
  );
}

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

function PomodoroTimer() {
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem('pomodoro-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const getDuration = useCallback((m: PomodoroMode) => {
    switch (m) {
      case 'work': return settings.workDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [settings]);
  
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);
  
  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (mode === 'work') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      if (newSessions % settings.sessionsBeforeLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
      }
    } else {
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
    }
    
    try {
      new Audio('/notification.mp3').play().catch(() => {});
    } catch {}
  };
  
  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
  };
  
  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
  };
  
  const saveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('pomodoro-settings', JSON.stringify(tempSettings));
    setShowSettings(false);
    setTimeLeft(tempSettings.workDuration * 60);
    setMode('work');
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100;
  
  const modeConfig = {
    work: { label: 'Focus Time', icon: Brain, color: 'text-red-500', bg: 'bg-red-500', bgLight: 'bg-red-100 dark:bg-red-900/20' },
    shortBreak: { label: 'Short Break', icon: Coffee, color: 'text-green-500', bg: 'bg-green-500', bgLight: 'bg-green-100 dark:bg-green-900/20' },
    longBreak: { label: 'Long Break', icon: Coffee, color: 'text-blue-500', bg: 'bg-blue-500', bgLight: 'bg-blue-100 dark:bg-blue-900/20' },
  };
  
  const CurrentIcon = modeConfig[mode].icon;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className={cn("gap-1", modeConfig[mode].bgLight)}>
                <CurrentIcon className={cn("w-3 h-3", modeConfig[mode].color)} />
                {modeConfig[mode].label}
              </Badge>
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-pomodoro-settings">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Timer Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Work (minutes)</label>
                        <Input 
                          type="number" 
                          min={1} 
                          max={60}
                          value={tempSettings.workDuration} 
                          onChange={(e) => setTempSettings({...tempSettings, workDuration: parseInt(e.target.value) || 25})}
                          data-testid="input-work-duration"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Short Break (min)</label>
                        <Input 
                          type="number" 
                          min={1} 
                          max={30}
                          value={tempSettings.shortBreakDuration} 
                          onChange={(e) => setTempSettings({...tempSettings, shortBreakDuration: parseInt(e.target.value) || 5})}
                          data-testid="input-short-break"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Long Break (min)</label>
                        <Input 
                          type="number" 
                          min={1} 
                          max={60}
                          value={tempSettings.longBreakDuration} 
                          onChange={(e) => setTempSettings({...tempSettings, longBreakDuration: parseInt(e.target.value) || 15})}
                          data-testid="input-long-break"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Sessions before long break</label>
                        <Input 
                          type="number" 
                          min={1} 
                          max={10}
                          value={tempSettings.sessionsBeforeLongBreak} 
                          onChange={(e) => setTempSettings({...tempSettings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4})}
                          data-testid="input-sessions"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">Cancel</Button>
                      <Button onClick={saveSettings} className="flex-1" data-testid="button-save-settings">Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardTitle className="text-lg mt-2">Pomodoro Timer</CardTitle>
            <CardDescription>Stay focused, take breaks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2">
              {(['work', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => (
                <Button
                  key={m}
                  variant={mode === m ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchMode(m)}
                  className="text-xs"
                  data-testid={`button-mode-${m}`}
                >
                  {m === 'work' ? 'Focus' : m === 'shortBreak' ? 'Short' : 'Long'}
                </Button>
              ))}
            </div>
            
            <div className="relative flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="8"
                    className="stroke-secondary"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                    className={cn("transition-all duration-1000", modeConfig[mode].color.replace('text-', 'stroke-'))}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold font-mono" data-testid="timer-display">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Session {sessionsCompleted + 1}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={resetTimer}
                data-testid="button-reset-timer"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                className={cn("px-8 gap-2", isRunning ? "bg-orange-500 hover:bg-orange-600" : "")}
                onClick={toggleTimer}
                data-testid="button-toggle-timer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex justify-center">
              <div className="flex gap-1.5">
                {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      i < (sessionsCompleted % settings.sessionsBeforeLongBreak) 
                        ? modeConfig.work.bg 
                        : "bg-secondary"
                    )}
                    data-testid={`session-indicator-${i}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{sessionsCompleted}</div>
            <p className="text-sm text-muted-foreground mt-1">Sessions Today</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{sessionsCompleted * settings.workDuration}</div>
            <p className="text-sm text-muted-foreground mt-1">Minutes Focused</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{Math.floor(sessionsCompleted / settings.sessionsBeforeLongBreak)}</div>
            <p className="text-sm text-muted-foreground mt-1">Cycles Completed</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Use the Pomodoro Technique</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Choose a task to work on</li>
            <li>Start the {settings.workDuration}-minute Focus timer</li>
            <li>Work on the task until the timer rings</li>
            <li>Take a {settings.shortBreakDuration}-minute Short Break</li>
            <li>After {settings.sessionsBeforeLongBreak} sessions, take a {settings.longBreakDuration}-minute Long Break</li>
            <li>Repeat the cycle!</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
