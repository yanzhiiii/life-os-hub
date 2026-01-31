import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks, useCreateTask, useDeleteTask, useUpdateTask } from "@/hooks/use-tasks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { CheckCircle2, Circle, Plus, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const taskSchema = insertTaskSchema.extend({
  priority: z.enum(["low", "medium", "high"]),
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
          <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Tasks</TabsTrigger>
          <TabsTrigger value="routines" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Routines</TabsTrigger>
          <TabsTrigger value="goals" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TaskList />
        </TabsContent>

        <TabsContent value="routines">
          <Card>
            <CardHeader>
              <CardTitle>Routines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Routine management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Long-term Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Goal tracking coming soon...
              </div>
            </CardContent>
          </Card>
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
            <Button className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Plus className="w-4 h-4 mr-2" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <Input placeholder="What needs to be done?" {...form.register("title")} />
              <div className="grid grid-cols-2 gap-4">
                <Select onValueChange={(v) => form.setValue("priority", v as any)} defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                {/* Due date picker would go here */}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Create Task</Button>
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
          >
            <button onClick={() => toggleStatus(task)} className="text-muted-foreground hover:text-primary transition-colors">
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
