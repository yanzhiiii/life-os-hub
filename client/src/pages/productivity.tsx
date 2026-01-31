import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useTasks, useCreateTask, useDeleteTask, useUpdateTask } from "@/hooks/use-tasks";
import { useRoutines, useCreateRoutine, useRoutineCompletions, useLogRoutineCompletion } from "@/hooks/use-routines";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/use-goals";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, insertRoutineSchema, insertGoalSchema } from "@shared/schema";
import { z } from "zod";
import { CheckCircle2, Circle, Plus, Trash2, CalendarIcon, Target, Flame, CheckSquare } from "lucide-react";
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
