import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-auth";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { useRoutines, useRoutineCompletions, useLogRoutineCompletion } from "@/hooks/use-routines";
import { useTransactions } from "@/hooks/use-finance";
import { useRecurringTemplates } from "@/hooks/use-recurring-templates";
import { useGoals } from "@/hooks/use-goals";
import { useEvents } from "@/hooks/use-events";
import { useDayStatuses } from "@/hooks/use-day-statuses";
import { useJournalEntries } from "@/hooks/use-journal";
import { format, differenceInDays, addMonths, setDate, isBefore, startOfDay, isToday, isFuture, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Briefcase, Coffee, Stethoscope, Palmtree, Clock, CalendarDays, Wallet, Target, BookOpen, TrendingUp, CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, createContext, useContext } from "react";

// Privacy context for hiding amounts
const PrivacyContext = createContext<{ hideAmounts: boolean; togglePrivacy: () => void }>({ 
  hideAmounts: true, 
  togglePrivacy: () => {} 
});

const usePrivacy = () => useContext(PrivacyContext);

const formatCurrency = (amount: number, currency: string = "PHP") => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const maskCurrency = (amount: number, currency: string = "PHP", hide: boolean = false) => {
  if (hide) {
    const currencySymbol = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(0).replace(/[\d,.\s]/g, '').trim();
    return `${currencySymbol}****`;
  }
  return formatCurrency(amount, currency);
};

const occursOn = (template: any, day: Date, startDate: Date): boolean => {
  if (isBefore(day, startDate)) return false;
  
  const freq = template.frequency;
  const d = day;
  const s = startDate;
  const dayOfWeek = d.getDay();
  const dayNum = d.getDate();
  const lastDayOfMonth = endOfMonth(d).getDate();
  
  switch (freq) {
    case 'once':
      return format(d, 'yyyy-MM-dd') === format(s, 'yyyy-MM-dd');
    case 'daily':
      return true;
    case 'weekly':
      return dayOfWeek === s.getDay();
    case 'biweekly': {
      const diffWeeks = Math.floor((d.getTime() - s.getTime()) / (7 * 86400000));
      return dayOfWeek === s.getDay() && diffWeeks % 2 === 0;
    }
    case 'semimonthly_1_15':
      return dayNum === 1 || dayNum === 15;
    case 'semimonthly_5_20':
      return dayNum === 5 || dayNum === 20;
    case 'semimonthly_15_eom': {
      const isEndOfMonth = dayNum === lastDayOfMonth;
      return dayNum === 15 || isEndOfMonth;
    }
    case 'monthly': {
      const targetDay = template.dayOfMonth || s.getDate();
      return dayNum === Math.min(targetDay, lastDayOfMonth);
    }
    case 'everyN': {
      const n = template.everyNDays || 2;
      const diffDays = Math.floor((d.getTime() - s.getTime()) / 86400000);
      return diffDays % n === 0;
    }
    default:
      return false;
  }
};

const getNextPayday = (paydayConfig: { type: string; dates?: number[] } | null | undefined) => {
  const today = startOfDay(new Date());
  const dates = paydayConfig?.dates || [15, 30];
  
  for (const payDay of dates.sort((a, b) => a - b)) {
    const paydayThisMonth = setDate(today, payDay);
    if (!isBefore(paydayThisMonth, today)) {
      return paydayThisMonth;
    }
  }
  
  const nextMonth = addMonths(today, 1);
  return setDate(nextMonth, Math.min(...dates));
};

const dayStatusInfo = {
  working: { label: "Working Day", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  standby: { label: "Standby", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
  rest: { label: "Rest Day", icon: Coffee, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
  sick_leave: { label: "Sick Leave", icon: Stethoscope, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  annual_leave: { label: "Annual Leave", icon: Palmtree, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  custom: { label: "Custom", icon: Clock, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
};

const moodEmojis: Record<string, string> = {
  happy: "Happy",
  neutral: "Neutral", 
  sad: "Sad",
  excited: "Excited",
  grateful: "Grateful",
};

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: tasks } = useTasks();
  const { data: transactions } = useTransactions();
  const { data: recurringTemplates } = useRecurringTemplates();
  const { data: routines } = useRoutines();
  const { data: goals } = useGoals();
  const { data: events } = useEvents();
  const { data: dayStatuses } = useDayStatuses();
  const { data: journalEntries } = useJournalEntries();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: logRoutineCompletion } = useLogRoutineCompletion();
  
  // Privacy state
  const [hideAmounts, setHideAmounts] = useState(() => {
    const saved = localStorage.getItem('dashboard-privacy');
    return saved === null ? true : JSON.parse(saved);
  });
  
  const togglePrivacy = () => {
    setHideAmounts((prev: boolean) => {
      localStorage.setItem('dashboard-privacy', JSON.stringify(!prev));
      return !prev;
    });
  };
  
  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayCompletions } = useRoutineCompletions(today);
  
  const currency = user?.currency || "PHP";
  const todayStatus = dayStatuses?.find(s => s.date === today);
  const statusInfo = dayStatusInfo[todayStatus?.status as keyof typeof dayStatusInfo] || dayStatusInfo.working;
  const StatusIcon = statusInfo.icon;

  const pendingTasks = tasks?.filter(t => t.status !== "done").slice(0, 5) || [];
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === "done").length || 0;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate current month's income/expense including recurring
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Actual transactions for this month
  const actualMonthIncome = transactions?.filter(t => {
    const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
    return isSameMonth(txDate, currentMonth) && t.type === 'income';
  }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  
  const actualMonthExpense = transactions?.filter(t => {
    const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
    return isSameMonth(txDate, currentMonth) && t.type === 'expense';
  }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  
  // Recurring templates for this month
  let recurringIncome = 0;
  let recurringExpense = 0;
  for (const day of daysInMonth) {
    const recurringForDay = (recurringTemplates || []).filter(r => {
      const startDate = typeof r.startDate === 'string' ? parseISO(r.startDate) : new Date(r.startDate);
      return occursOn(r, day, startDate);
    });
    recurringIncome += recurringForDay.filter(r => r.type === 'income').reduce((acc, r) => acc + Number(r.amount), 0);
    recurringExpense += recurringForDay.filter(r => r.type === 'expense').reduce((acc, r) => acc + Number(r.amount), 0);
  }
  
  const totalIncome = actualMonthIncome + recurringIncome;
  const totalExpense = actualMonthExpense + recurringExpense;
  const balance = totalIncome - totalExpense;

  const nextPayday = getNextPayday(user?.paydayConfig);
  const daysUntilPayday = differenceInDays(nextPayday, startOfDay(new Date()));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const activeGoals = goals?.filter(g => !g.completed) || [];
  const completedGoals = goals?.filter(g => g.completed).length || 0;

  const upcomingEvents = events?.filter(e => {
    const eventDate = new Date(e.startTime);
    return isToday(eventDate) || isFuture(eventDate);
  }).slice(0, 3) || [];

  const latestJournalEntry = journalEntries?.[0];

  const toggleTaskStatus = (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    updateTask({ id: taskId, status: newStatus });
  };

  const isRoutineStepCompleted = (routineId: number, stepIndex: number) => {
    const completion = todayCompletions?.find(c => c.routineId === routineId);
    return completion?.completedSteps?.[stepIndex] || false;
  };

  const toggleRoutineStep = (routineId: number, stepIndex: number, totalSteps: number) => {
    const completion = todayCompletions?.find(c => c.routineId === routineId);
    const currentSteps: boolean[] = completion?.completedSteps || Array(totalSteps).fill(false);
    
    const newSteps = [...currentSteps];
    newSteps[stepIndex] = !newSteps[stepIndex];
    
    const completedCount = newSteps.filter(Boolean).length;
    
    logRoutineCompletion({
      routineId,
      date: today,
      completedSteps: newSteps,
    });
  };

  return (
    <Shell>
      <div className="space-y-6 sm:space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold" data-testid="text-greeting">
              {greeting}, {user?.displayName || user?.username}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="px-3 sm:px-4 py-2 rounded-xl shadow-sm border bg-gradient-to-br from-card to-secondary/30 flex items-center gap-2" data-testid="card-clock">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <div className="text-lg sm:text-xl font-mono font-bold" data-testid="text-time">
                {format(currentTime, "h:mm:ss a")}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePrivacy}
              className="gap-2"
              data-testid="button-toggle-privacy"
            >
              {hideAmounts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{hideAmounts ? "Show" : "Hide"}</span>
            </Button>
            <div className={cn(
              "px-3 sm:px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2",
              statusInfo.bg
            )} data-testid="card-today-status">
              <StatusIcon className={cn("w-4 h-4 sm:w-5 sm:h-5", statusInfo.color)} />
              <div>
                <div className="font-semibold text-xs sm:text-sm">
                  {todayStatus?.status === "custom" ? todayStatus.customLabel : statusInfo.label}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Today's Status</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg shadow-blue-500/5 border-l-4 border-l-blue-500" data-testid="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maskCurrency(balance, currency, hideAmounts)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {balance >= 0 ? (
                  <><ArrowUpRight className="text-green-500 w-3 h-3"/> Healthy</>
                ) : (
                  <><ArrowDownRight className="text-red-500 w-3 h-3"/> Negative</>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-purple-500/5 border-l-4 border-l-purple-500" data-testid="card-tasks">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Task Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}/{totalTasks}</div>
              <Progress value={taskCompletionRate} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{taskCompletionRate}% completed</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-green-500/5 border-l-4 border-l-green-500" data-testid="card-goals">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeGoals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedGoals} completed
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-orange-500/5 border-l-4 border-l-orange-500" data-testid="card-payday">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Next Payday
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {daysUntilPayday === 0 ? "Today!" : `${daysUntilPayday} Day${daysUntilPayday !== 1 ? 's' : ''}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{format(nextPayday, "MMM do, yyyy")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Today's Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group" 
                      data-testid={`task-${task.id}`}
                    >
                      <Checkbox
                        checked={task.status === "done"}
                        onCheckedChange={() => toggleTaskStatus(task.id, task.status || "todo")}
                        data-testid={`checkbox-task-${task.id}`}
                      />
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium group-hover:text-primary transition-colors",
                          task.status === "done" && "line-through text-muted-foreground"
                        )}>{task.title}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            task.priority === "high" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                            task.priority === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                            task.priority === "low" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          )}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {format(new Date(task.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      All caught up! Great job.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.startTime);
                    const daysAway = differenceInDays(eventDate, new Date());
                    return (
                      <div 
                        key={event.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                        data-testid={`event-${event.id}`}
                      >
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(eventDate, "EEE, MMM d 'at' h:mm a")}
                          </p>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          isToday(eventDate) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        )}>
                          {isToday(eventDate) ? "Today" : `${daysAway} day${daysAway !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    );
                  })}
                  {upcomingEvents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No upcoming events scheduled.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-sm text-muted-foreground">Income</p>
                    <p className="text-xl font-bold text-green-600">{maskCurrency(totalIncome, currency, hideAmounts)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-xl font-bold text-red-600">{maskCurrency(totalExpense, currency, hideAmounts)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className={cn("text-xl font-bold", balance >= 0 ? "text-blue-600" : "text-red-600")}>
                      {maskCurrency(balance, currency, hideAmounts)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="shadow-md bg-gradient-to-br from-card to-secondary/20">
              <CardHeader>
                <CardTitle>Daily Routines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {routines?.slice(0, 3).map(routine => {
                  const completedCount = routine.steps.filter((_, idx) => 
                    isRoutineStepCompleted(routine.id, idx)
                  ).length;
                  const progress = Math.round((completedCount / routine.steps.length) * 100);
                  
                  return (
                    <div key={routine.id} className="space-y-3" data-testid={`routine-${routine.id}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{routine.title}</h4>
                        <span className="text-xs text-muted-foreground">{completedCount}/{routine.steps.length}</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <div className="space-y-2">
                        {routine.steps.map((step, idx) => {
                          const isCompleted = isRoutineStepCompleted(routine.id, idx);
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={() => toggleRoutineStep(routine.id, idx, routine.steps.length)}
                                data-testid={`checkbox-routine-${routine.id}-step-${idx}`}
                              />
                              <span className={cn(
                                "text-sm",
                                isCompleted && "line-through text-muted-foreground"
                              )}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {(!routines || routines.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No routines set up yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Active Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeGoals.slice(0, 3).map(goal => {
                  const milestones = goal.milestones || [];
                  const completedMilestones = milestones.filter(m => m.completed).length;
                  const progress = milestones.length > 0 
                    ? Math.round((completedMilestones / milestones.length) * 100) 
                    : 0;
                  
                  return (
                    <div key={goal.id} className="space-y-2" data-testid={`goal-${goal.id}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{goal.title}</p>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      {goal.targetDate && (
                        <p className="text-xs text-muted-foreground">
                          Target: {format(new Date(goal.targetDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  );
                })}
                {activeGoals.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No active goals.
                  </div>
                )}
              </CardContent>
            </Card>

            {latestJournalEntry && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Latest Journal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(latestJournalEntry.date), "EEEE, MMM d")}
                      </p>
                      <span className="text-sm">
                        {latestJournalEntry.mood ? (moodEmojis[latestJournalEntry.mood] || latestJournalEntry.mood) : "No mood"}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-3">{latestJournalEntry.content}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
