import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTasks } from "@/hooks/use-tasks";
import { useTransactions, useDebts, useSavingsGoals } from "@/hooks/use-finance";
import { useRecurringTemplates } from "@/hooks/use-recurring-templates";
import { useGoals } from "@/hooks/use-goals";
import { useRoutines, useRoutineCompletions } from "@/hooks/use-routines";
import { useJournalEntries } from "@/hooks/use-journal";
import { useUser } from "@/hooks/use-auth";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameDay, differenceInDays, isWithinInterval, isBefore } from "date-fns";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { 
  TrendingUp, TrendingDown, Target, CheckCircle2, PiggyBank, CreditCard, Flame, 
  Smile, Frown, Brain, Zap, Calendar, DollarSign, ArrowUpRight, ArrowDownRight,
  Award, BarChart3, Activity, Clock, Percent, Wallet, AlertCircle, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const moodValues: Record<string, number> = {
  happy: 5,
  excited: 5,
  grateful: 4,
  neutral: 3,
  sad: 1,
};

const moodLabels: Record<string, string> = {
  happy: "Happy",
  excited: "Excited",
  grateful: "Grateful",
  neutral: "Neutral",
  sad: "Sad",
};

const moodColors: Record<string, string> = {
  happy: "#22c55e",
  excited: "#f59e0b",
  grateful: "#8b5cf6",
  neutral: "#6b7280",
  sad: "#ef4444",
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
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

export default function InsightsPage() {
  const { data: tasks } = useTasks();
  const { data: transactions } = useTransactions();
  const { data: recurringTemplates } = useRecurringTemplates();
  const { data: debts } = useDebts();
  const { data: savings } = useSavingsGoals();
  const { data: goals } = useGoals();
  const { data: routines } = useRoutines();
  const { data: journalEntries } = useJournalEntries();
  const { data: user } = useUser();
  
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const currency = user?.currency || "PHP";
  
  // Get routine completions for today
  const { data: todayCompletions } = useRoutineCompletions(todayStr);

  // === FINANCIAL STATISTICS ===
  // This month's actual transactions
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonthArr = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const thisMonthTransactions = transactions?.filter(t => {
    const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
    return isWithinInterval(txDate, { start: monthStart, end: monthEnd });
  }) || [];
  
  const actualMonthIncome = thisMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const actualMonthExpense = thisMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  
  // Calculate recurring templates for this month
  let recurringMonthIncome = 0;
  let recurringMonthExpense = 0;
  for (const day of daysInMonthArr) {
    const recurringForDay = (recurringTemplates || []).filter(r => {
      const startDate = typeof r.startDate === 'string' ? parseISO(r.startDate) : new Date(r.startDate);
      return occursOn(r, day, startDate);
    });
    recurringMonthIncome += recurringForDay.filter(r => r.type === 'income').reduce((acc, r) => acc + Number(r.amount), 0);
    recurringMonthExpense += recurringForDay.filter(r => r.type === 'expense').reduce((acc, r) => acc + Number(r.amount), 0);
  }
  
  const thisMonthIncome = actualMonthIncome + recurringMonthIncome;
  const thisMonthExpense = actualMonthExpense + recurringMonthExpense;
  const thisMonthNet = thisMonthIncome - thisMonthExpense;
  
  // Total income/expense (all time + recurring for this month projection)
  const allTimeActualIncome = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const allTimeActualExpense = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const totalIncome = allTimeActualIncome + recurringMonthIncome;
  const totalExpense = allTimeActualExpense + recurringMonthExpense;
  const netBalance = totalIncome - totalExpense;
  
  // Calculate daily average expense
  const daysInMonth = differenceInDays(today, monthStart) + 1;
  const dailyAvgExpense = daysInMonth > 0 ? thisMonthExpense / daysInMonth : 0;
  
  // Savings rate (income saved percentage) - clamped to reasonable range
  const rawSavingsRate = thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100 : 0;
  const savingsRate = Math.max(-100, Math.min(100, rawSavingsRate));
  
  // Category breakdown
  const categoryData = transactions
    ?.filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += Number(t.amount);
      } else {
        acc.push({ name: t.category, value: Number(t.amount) });
      }
      return acc;
    }, [] as { name: string, value: number }[])
    .sort((a, b) => b.value - a.value) || [];

  // Top spending category
  const topCategory = categoryData[0];

  // Debt progress
  const totalDebt = debts?.reduce((acc, d) => acc + Number(d.totalAmount), 0) || 0;
  const remainingDebt = debts?.reduce((acc, d) => acc + Number(d.remainingAmount), 0) || 0;
  const debtPaid = totalDebt - remainingDebt;
  const debtProgress = totalDebt > 0 ? (debtPaid / totalDebt) * 100 : 0;

  // Savings progress
  const totalSavingsTarget = savings?.reduce((acc, s) => acc + Number(s.targetAmount), 0) || 0;
  const totalSaved = savings?.reduce((acc, s) => acc + Number(s.currentAmount || 0), 0) || 0;
  const savingsProgress = totalSavingsTarget > 0 ? (totalSaved / totalSavingsTarget) * 100 : 0;

  // === TASK STATISTICS ===
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const totalTasks = tasks?.length || 0;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Tasks by priority
  const highPriorityTasks = tasks?.filter(t => t.priority === 'high') || [];
  const highPriorityCompleted = highPriorityTasks.filter(t => t.status === 'done').length;
  const mediumPriorityTasks = tasks?.filter(t => t.priority === 'medium') || [];
  const mediumPriorityCompleted = mediumPriorityTasks.filter(t => t.status === 'done').length;
  const lowPriorityTasks = tasks?.filter(t => t.priority === 'low') || [];
  const lowPriorityCompleted = lowPriorityTasks.filter(t => t.status === 'done').length;
  
  const priorityData = [
    { name: 'High', total: highPriorityTasks.length, completed: highPriorityCompleted, color: '#ef4444' },
    { name: 'Medium', total: mediumPriorityTasks.length, completed: mediumPriorityCompleted, color: '#f59e0b' },
    { name: 'Low', total: lowPriorityTasks.length, completed: lowPriorityCompleted, color: '#22c55e' },
  ].filter(p => p.total > 0);

  // Pending tasks (not done)
  const pendingTasks = tasks?.filter(t => t.status !== 'done').length || 0;
  
  // Overdue tasks
  const overdueTasks = tasks?.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false;
    const dueDate = typeof t.dueDate === 'string' ? parseISO(t.dueDate) : new Date(t.dueDate);
    return dueDate < today;
  }).length || 0;

  // === GOAL STATISTICS ===
  const completedGoals = goals?.filter(g => g.completed).length || 0;
  const activeGoals = goals?.filter(g => !g.completed).length || 0;
  const totalGoals = goals?.length || 0;
  
  // Calculate total milestones across all goals
  const totalMilestones = goals?.reduce((acc, g) => acc + (g.milestones?.length || 0), 0) || 0;
  const completedMilestones = goals?.reduce((acc, g) => {
    return acc + (g.milestones?.filter(m => m.completed).length || 0);
  }, 0) || 0;
  const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  // === ROUTINE STATISTICS ===
  const totalRoutines = routines?.length || 0;
  
  // Today's routine completion
  const getTodayRoutineProgress = () => {
    if (!routines || !todayCompletions) return { completed: 0, total: 0, percentage: 0 };
    
    let totalSteps = 0;
    let completedSteps = 0;
    
    routines.forEach(routine => {
      const stepsCount = routine.steps?.length ?? 0;
      totalSteps += stepsCount;
      const completion = todayCompletions.find(c => c.routineId === routine.id);
      if (completion?.completedSteps) {
        completedSteps += completion.completedSteps.filter(Boolean).length;
      }
    });
    
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    };
  };
  
  const todayRoutineProgress = getTodayRoutineProgress();
  
  // Routines with 100% completion today
  const fullyCompletedRoutinesToday = routines?.filter(routine => {
    const completion = todayCompletions?.find(c => c.routineId === routine.id);
    if (!completion?.completedSteps) return false;
    return completion.completedSteps.every(Boolean);
  }).length || 0;

  // === WEEKLY DATA ===
  const weekDays = eachDayOfInterval({
    start: startOfWeek(today),
    end: endOfWeek(today)
  });
  
  const weeklyTaskData = weekDays.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayTasks = tasks?.filter(t => {
      if (!t.dueDate) return false;
      const taskDate = typeof t.dueDate === 'string' ? parseISO(t.dueDate) : new Date(t.dueDate);
      return format(taskDate, "yyyy-MM-dd") === dayStr;
    }) || [];
    
    return {
      name: format(day, "EEE"),
      completed: dayTasks.filter(t => t.status === 'done').length,
      total: dayTasks.length,
    };
  });

  // 6-month trend data
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subDays(today, (5 - i) * 30);
    const monthTransactions = transactions?.filter(t => {
      const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
      return format(txDate, "MMM yyyy") === format(monthDate, "MMM yyyy");
    }) || [];
    
    return {
      month: format(monthDate, "MMM"),
      income: monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0),
      expense: monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0),
    };
  });

  // === MOOD STATISTICS ===
  const moodDistribution = journalEntries?.reduce((acc, entry) => {
    const mood = entry.mood || 'neutral';
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const moodDistributionData = Object.entries(moodDistribution).map(([mood, count]) => ({
    name: moodLabels[mood] || mood,
    value: count,
    color: moodColors[mood] || "#6b7280",
  }));

  // Average Mood Score
  const avgMoodScore = journalEntries?.length 
    ? journalEntries.reduce((acc, e) => acc + (moodValues[e.mood || 'neutral'] || 3), 0) / journalEntries.length
    : 3;

  // Most common mood
  const mostCommonMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0];

  // Mood vs Spending Correlation
  const getMoodSpendingData = () => {
    if (!journalEntries || !transactions) return [];
    
    const moodSpending: Record<string, { total: number; count: number }> = {};
    
    journalEntries.forEach(entry => {
      const entryDate = typeof entry.date === 'string' ? parseISO(entry.date) : new Date(entry.date);
      const mood = entry.mood || 'neutral';
      
      const dayTransactions = transactions.filter(t => {
        const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
        return isSameDay(txDate, entryDate) && t.type === 'expense';
      });
      
      const daySpending = dayTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
      
      if (!moodSpending[mood]) {
        moodSpending[mood] = { total: 0, count: 0 };
      }
      moodSpending[mood].total += daySpending;
      moodSpending[mood].count += 1;
    });
    
    return Object.entries(moodSpending).map(([mood, data]) => ({
      mood: moodLabels[mood] || mood,
      avgSpending: data.count > 0 ? Math.round(data.total / data.count) : 0,
      color: moodColors[mood] || "#6b7280",
    })).sort((a, b) => moodValues[Object.keys(moodLabels).find(k => moodLabels[k] === a.mood) || 'neutral'] - 
                       moodValues[Object.keys(moodLabels).find(k => moodLabels[k] === b.mood) || 'neutral']);
  };

  const moodSpendingData = getMoodSpendingData();

  // Mood vs Productivity Correlation
  const getMoodProductivityData = () => {
    if (!journalEntries || !tasks) return [];
    
    const moodProductivity: Record<string, { completed: number; total: number; count: number }> = {};
    
    journalEntries.forEach(entry => {
      const entryDate = typeof entry.date === 'string' ? parseISO(entry.date) : new Date(entry.date);
      const mood = entry.mood || 'neutral';
      const dayStr = format(entryDate, "yyyy-MM-dd");
      
      const dayTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const taskDate = typeof t.dueDate === 'string' ? parseISO(t.dueDate) : new Date(t.dueDate);
        return format(taskDate, "yyyy-MM-dd") === dayStr;
      });
      
      if (!moodProductivity[mood]) {
        moodProductivity[mood] = { completed: 0, total: 0, count: 0 };
      }
      moodProductivity[mood].completed += dayTasks.filter(t => t.status === 'done').length;
      moodProductivity[mood].total += dayTasks.length;
      moodProductivity[mood].count += 1;
    });
    
    return Object.entries(moodProductivity).map(([mood, data]) => ({
      mood: moodLabels[mood] || mood,
      avgCompleted: data.count > 0 ? Math.round((data.completed / data.count) * 10) / 10 : 0,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      color: moodColors[mood] || "#6b7280",
    })).sort((a, b) => {
      const moodA = Object.keys(moodLabels).find(k => moodLabels[k] === a.mood) || 'neutral';
      const moodB = Object.keys(moodLabels).find(k => moodLabels[k] === b.mood) || 'neutral';
      return moodValues[moodA] - moodValues[moodB];
    });
  };

  const moodProductivityData = getMoodProductivityData();

  // Weekly Mood Trend
  const weeklyMoodData = weekDays.map(day => {
    const dayEntry = journalEntries?.find(entry => {
      const entryDate = typeof entry.date === 'string' ? parseISO(entry.date) : new Date(entry.date);
      return isSameDay(entryDate, day);
    });
    
    return {
      name: format(day, "EEE"),
      mood: dayEntry ? moodValues[dayEntry.mood || 'neutral'] : null,
      moodLabel: dayEntry ? moodLabels[dayEntry.mood || 'neutral'] : "No entry",
    };
  });

  // Life Balance Radar
  const lifeBalanceData = [
    { subject: 'Finances', value: Math.min(100, Math.max(0, (savingsRate + 100) / 2)), fullMark: 100 },
    { subject: 'Tasks', value: taskCompletionRate, fullMark: 100 },
    { subject: 'Goals', value: totalGoals > 0 ? ((completedGoals / totalGoals) * 100) : 0, fullMark: 100 },
    { subject: 'Routines', value: todayRoutineProgress.percentage, fullMark: 100 },
    { subject: 'Mood', value: avgMoodScore * 20, fullMark: 100 },
    { subject: 'Savings', value: savingsProgress, fullMark: 100 },
  ];

  return (
    <Shell>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Insights</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track your progress across all areas of life.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-xl w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 min-w-[70px]" data-testid="tab-overview">
            <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Overview</span><span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 min-w-[70px]" data-testid="tab-finance">
            <Wallet className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Finance</span><span className="sm:hidden">Money</span>
          </TabsTrigger>
          <TabsTrigger value="productivity" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 min-w-[70px]" data-testid="tab-productivity">
            <Activity className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Productivity</span><span className="sm:hidden">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="wellness" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 min-w-[70px]" data-testid="tab-wellness">
            <Brain className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Wellness</span><span className="sm:hidden">Mood</span>
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-200 dark:border-green-800">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Net Balance</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(netBalance, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Tasks Done</p>
                    <p className="text-lg sm:text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 shrink-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Goals Progress</p>
                    <p className="text-lg sm:text-2xl font-bold">{completedGoals}/{totalGoals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20 shrink-0">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Today's Routines</p>
                    <p className="text-lg sm:text-2xl font-bold">{todayRoutineProgress.percentage.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* This Month Summary */}
          <Card className="mb-6 sm:mb-8 shadow-lg" data-testid="card-month-summary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                This Month Summary
              </CardTitle>
              <CardDescription>{format(today, "MMMM yyyy")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <ArrowUpRight className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(thisMonthIncome, currency)}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <ArrowDownRight className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(thisMonthExpense, currency)}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Percent className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Savings Rate</p>
                  <p className={cn("text-lg font-bold", savingsRate >= 0 ? "text-blue-600" : "text-red-600")}>
                    {savingsRate.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                  <DollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Daily Avg Spend</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(dailyAvgExpense, currency)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Life Balance Radar */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <Card className="shadow-lg" data-testid="card-life-balance">
              <CardHeader>
                <CardTitle>Life Balance</CardTitle>
                <CardDescription>Overview of all life areas</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={lifeBalanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    <span>Task Completion Rate</span>
                  </div>
                  <span className="font-bold">{taskCompletionRate.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Milestone Progress</span>
                  </div>
                  <span className="font-bold">{completedMilestones}/{totalMilestones}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span>Routines Completed Today</span>
                  </div>
                  <span className="font-bold">{fullyCompletedRoutinesToday}/{totalRoutines}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Smile className="w-5 h-5 text-green-500" />
                    <span>Average Mood Score</span>
                  </div>
                  <span className="font-bold">{avgMoodScore.toFixed(1)}/5</span>
                </div>
                {overdueTasks > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Overdue Tasks</span>
                    </div>
                    <span className="font-bold text-red-600">{overdueTasks}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FINANCE TAB */}
        <TabsContent value="finance" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Finance KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 shrink-0">
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Income</p>
                    <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(totalIncome, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20 shrink-0">
                    <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Expenses</p>
                    <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(totalExpense, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                    <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Saved</p>
                    <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(totalSaved, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20 shrink-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Remaining Debt</p>
                    <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(remainingDebt, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Income vs Expense Trend */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>6-month trend overview</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, currency)}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: 'hsl(var(--card))'
                      }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Income" />
                    <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Spending by Category */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Where your money goes</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] sm:h-[300px]">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No expense data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Goals Progress */}
          <Card className="shadow-lg mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle>Financial Goals</CardTitle>
              <CardDescription>Debt payoff and savings progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Debt Payoff</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{debtProgress.toFixed(0)}%</span>
                </div>
                <Progress value={debtProgress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(debtPaid, currency)} paid of {formatCurrency(totalDebt, currency)}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Savings Goals</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{savingsProgress.toFixed(0)}%</span>
                </div>
                <Progress value={savingsProgress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(totalSaved, currency)} saved of {formatCurrency(totalSavingsTarget, currency)}
                </p>
              </div>

              {savings && savings.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  {savings.map((s) => {
                    const progress = Number(s.targetAmount) > 0 
                      ? (Number(s.currentAmount || 0) / Number(s.targetAmount)) * 100 
                      : 0;
                    return (
                      <div key={s.id} className="p-3 rounded-lg bg-secondary/30">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{s.name}</span>
                          <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(Number(s.currentAmount || 0), currency)} / {formatCurrency(Number(s.targetAmount), currency)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Spending Category */}
          {topCategory && (
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/20">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top Spending Category</p>
                    <p className="text-xl font-bold">{topCategory.name}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(topCategory.value, currency)} total spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PRODUCTIVITY TAB */}
        <TabsContent value="productivity" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Productivity KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Completion Rate</p>
                    <p className="text-lg sm:text-xl font-bold">{taskCompletionRate.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20 shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending Tasks</p>
                    <p className="text-lg sm:text-xl font-bold">{pendingTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 shrink-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Active Goals</p>
                    <p className="text-lg sm:text-xl font-bold">{activeGoals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20 shrink-0">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Routines Today</p>
                    <p className="text-lg sm:text-xl font-bold">{todayRoutineProgress.completed}/{todayRoutineProgress.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Weekly Task Completion */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Weekly Productivity</CardTitle>
                <CardDescription>Tasks completed this week</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTaskData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: 'hsl(var(--card))'
                      }} 
                    />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tasks by Priority */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
                <CardDescription>Breakdown of task priorities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priorityData.map((priority) => (
                    <div key={priority.name}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: priority.color }} />
                          <span className="font-medium">{priority.name} Priority</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {priority.completed}/{priority.total} done
                        </span>
                      </div>
                      <Progress 
                        value={priority.total > 0 ? (priority.completed / priority.total) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  ))}
                  {priorityData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tasks yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals & Milestones */}
          <Card className="shadow-lg mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle>Goals & Milestones</CardTitle>
              <CardDescription>Track your long-term objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{completedGoals}</p>
                  <p className="text-sm text-muted-foreground">Completed Goals</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{activeGoals}</p>
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                  <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{milestoneProgress.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Milestone Progress</p>
                </div>
              </div>

              {goals && goals.filter(g => !g.completed).length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Active Goals Progress</h4>
                  {goals.filter(g => !g.completed).map((goal) => {
                    const milestonesDone = goal.milestones?.filter(m => m.completed).length || 0;
                    const milestonesTotal = goal.milestones?.length || 0;
                    const progress = milestonesTotal > 0 ? (milestonesDone / milestonesTotal) * 100 : 0;
                    
                    return (
                      <div key={goal.id} className="p-3 rounded-lg bg-secondary/30">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{goal.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {milestonesDone}/{milestonesTotal} milestones
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Routine Progress */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Today's Routine Progress</CardTitle>
              <CardDescription>Your daily habits completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="hsl(var(--secondary))"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="12"
                      strokeDasharray={`${todayRoutineProgress.percentage * 3.52} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{todayRoutineProgress.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <div className="text-center text-muted-foreground">
                <p>{todayRoutineProgress.completed} of {todayRoutineProgress.total} steps completed</p>
                <p className="text-sm mt-1">{fullyCompletedRoutinesToday} of {totalRoutines} routines fully done</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WELLNESS TAB */}
        <TabsContent value="wellness" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mood Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-200 dark:border-violet-800">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20 shrink-0">
                    {avgMoodScore >= 4 ? <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /> : 
                     avgMoodScore >= 3 ? <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" /> : 
                     <Frown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Avg Mood</p>
                    <p className="text-lg sm:text-xl font-bold">{avgMoodScore.toFixed(1)}/5</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/20 shrink-0">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Journal Entries</p>
                    <p className="text-lg sm:text-xl font-bold">{journalEntries?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 shrink-0">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Most Common</p>
                    <p className="text-lg sm:text-xl font-bold truncate">
                      {mostCommonMood ? moodLabels[mostCommonMood[0]] || mostCommonMood[0] : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Mood Types</p>
                    <p className="text-lg sm:text-xl font-bold">{Object.keys(moodDistribution).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Mood Trend */}
          <Card className="shadow-lg mb-6 sm:mb-8" data-testid="card-weekly-mood">
            <CardHeader>
              <CardTitle>Weekly Mood Trend</CardTitle>
              <CardDescription>Your emotional journey this week</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyMoodData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} className="text-xs" />
                  <Tooltip 
                    formatter={(value) => [value ? `${value}/5` : "No entry", "Mood Score"]}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      backgroundColor: 'hsl(var(--card))'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 5 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card className="shadow-lg mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
              <CardDescription>How you've been feeling overall</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 h-12 mb-4 rounded-lg overflow-hidden">
                {moodDistributionData.length > 0 ? moodDistributionData.map((item, i) => (
                  <div 
                    key={i}
                    className="transition-all hover:scale-y-110"
                    style={{ 
                      backgroundColor: item.color, 
                      flex: item.value,
                      minWidth: item.value > 0 ? '12px' : '0'
                    }}
                    title={`${item.name}: ${item.value} entries`}
                  />
                )) : (
                  <div className="w-full bg-secondary flex items-center justify-center text-muted-foreground">
                    No mood data yet
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {moodDistributionData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cross-Module Insights */}
          <div className="mb-4">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Cross-Module Insights
            </h2>
            <p className="text-sm text-muted-foreground">Discover patterns between your mood, spending, and productivity.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Mood vs Spending */}
            <Card className="shadow-lg" data-testid="card-mood-spending">
              <CardHeader>
                <CardTitle>Mood vs Spending</CardTitle>
                <CardDescription>Average daily spending by mood</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] sm:h-[300px]">
                {moodSpendingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moodSpendingData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mood" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value, currency), "Avg Spending"]}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          backgroundColor: 'hsl(var(--card))'
                        }} 
                      />
                      <Bar 
                        dataKey="avgSpending" 
                        radius={[4, 4, 0, 0]}
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Add journal entries to see mood-spending correlations
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mood vs Productivity */}
            <Card className="shadow-lg" data-testid="card-mood-productivity">
              <CardHeader>
                <CardTitle>Mood vs Productivity</CardTitle>
                <CardDescription>Task completion rate by mood</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] sm:h-[300px]">
                {moodProductivityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moodProductivityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mood" className="text-xs" />
                      <YAxis className="text-xs" domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, "Completion Rate"]}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          backgroundColor: 'hsl(var(--card))'
                        }} 
                      />
                      <Bar 
                        dataKey="completionRate" 
                        radius={[4, 4, 0, 0]}
                        fill="#8b5cf6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Add journal entries and tasks to see mood-productivity correlations
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Shell>
  );
}
