import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTasks } from "@/hooks/use-tasks";
import { useTransactions, useDebts, useSavingsGoals } from "@/hooks/use-finance";
import { useGoals } from "@/hooks/use-goals";
import { useRoutines, useRoutineCompletions } from "@/hooks/use-routines";
import { useJournalEntries } from "@/hooks/use-journal";
import { useUser } from "@/hooks/use-auth";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { TrendingUp, Target, CheckCircle2, PiggyBank, CreditCard, Flame, Smile, Frown, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

export default function InsightsPage() {
  const { data: tasks } = useTasks();
  const { data: transactions } = useTransactions();
  const { data: debts } = useDebts();
  const { data: savings } = useSavingsGoals();
  const { data: goals } = useGoals();
  const { data: routines } = useRoutines();
  const { data: journalEntries } = useJournalEntries();
  const { data: user } = useUser();
  
  const currency = user?.currency || "PHP";

  // Finance Stats
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  
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
    }, [] as { name: string, value: number }[]) || [];

  // Debt progress
  const totalDebt = debts?.reduce((acc, d) => acc + Number(d.totalAmount), 0) || 0;
  const remainingDebt = debts?.reduce((acc, d) => acc + Number(d.remainingAmount), 0) || 0;
  const debtPaid = totalDebt - remainingDebt;
  const debtProgress = totalDebt > 0 ? (debtPaid / totalDebt) * 100 : 0;

  // Savings progress
  const totalSavingsTarget = savings?.reduce((acc, s) => acc + Number(s.targetAmount), 0) || 0;
  const totalSaved = savings?.reduce((acc, s) => acc + Number(s.currentAmount || 0), 0) || 0;
  const savingsProgress = totalSavingsTarget > 0 ? (totalSaved / totalSavingsTarget) * 100 : 0;

  // Task stats
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const totalTasks = tasks?.length || 0;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Goals progress
  const completedGoals = goals?.filter(g => g.completed).length || 0;
  const activeGoals = goals?.filter(g => !g.completed).length || 0;

  // Weekly task data
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date())
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

  // Income vs Expense trend (using real transaction data)
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subDays(new Date(), (5 - i) * 30);
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

  // Mood Distribution
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
    { subject: 'Finances', value: Math.min(100, Math.max(0, (totalIncome - totalExpense) / 1000)), fullMark: 100 },
    { subject: 'Tasks', value: taskCompletionRate, fullMark: 100 },
    { subject: 'Goals', value: goals?.length ? (completedGoals / (completedGoals + activeGoals)) * 100 : 0, fullMark: 100 },
    { subject: 'Routines', value: routines?.length ? routines.length * 20 : 0, fullMark: 100 },
    { subject: 'Mood', value: journalEntries?.length ? (journalEntries.reduce((acc, e) => acc + (moodValues[e.mood || 'neutral'] || 3), 0) / journalEntries.length) * 20 : 0, fullMark: 100 },
    { subject: 'Savings', value: savingsProgress, fullMark: 100 },
  ];

  // Average Mood Score
  const avgMoodScore = journalEntries?.length 
    ? journalEntries.reduce((acc, e) => acc + (moodValues[e.mood || 'neutral'] || 3), 0) / journalEntries.length
    : 3;

  return (
    <Shell>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Insights</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track your progress across all areas of life.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(totalIncome - totalExpense, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
                <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold">{activeGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Routines</p>
                <p className="text-2xl font-bold">{routines?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Income vs Expense Trend */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>6-month trend overview</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: 'hsl(var(--card))'
                  }} 
                />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
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
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Weekly Task Completion */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Weekly Productivity</CardTitle>
            <CardDescription>Tasks completed this week</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Goals Progress */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Financial Goals</CardTitle>
            <CardDescription>Debt payoff and savings progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-500" />
                  <span className="font-medium">Debt Payoff</span>
                </div>
                <span className="text-sm text-muted-foreground">{debtProgress.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                  style={{ width: `${debtProgress}%` }}
                />
              </div>
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
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${savingsProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(totalSaved, currency)} saved of {formatCurrency(totalSavingsTarget, currency)}
              </p>
            </div>

            {savings?.map((s) => {
              const progress = Number(s.targetAmount) > 0 
                ? (Number(s.currentAmount || 0) / Number(s.targetAmount)) * 100 
                : 0;
              return (
                <div key={s.id} className="pl-7">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Cross-Module Insights Section */}
      <div className="mt-8 mb-4">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Cross-Module Insights
        </h2>
        <p className="text-muted-foreground">Discover patterns between your mood, spending, and productivity.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Mood Score Card */}
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-200 dark:border-violet-800" data-testid="card-mood-score">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Mood</p>
                <div className="flex items-center gap-2">
                  <p className="text-4xl font-bold">{avgMoodScore.toFixed(1)}</p>
                  <span className="text-muted-foreground">/5</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {journalEntries?.length || 0} entries
                </p>
              </div>
              <div className={cn(
                "p-4 rounded-xl",
                avgMoodScore >= 4 ? "bg-green-100 dark:bg-green-900/30" : 
                avgMoodScore >= 3 ? "bg-yellow-100 dark:bg-yellow-900/30" : 
                "bg-red-100 dark:bg-red-900/30"
              )}>
                {avgMoodScore >= 4 ? (
                  <Smile className="w-8 h-8 text-green-600" />
                ) : avgMoodScore >= 3 ? (
                  <Smile className="w-8 h-8 text-yellow-600" />
                ) : (
                  <Frown className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journal Entries Count */}
        <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 border-pink-200 dark:border-pink-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Zap className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Journal Streak</p>
                <p className="text-2xl font-bold">{journalEntries?.length || 0} entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood Distribution Mini */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-3">Mood Distribution</p>
            <div className="flex gap-1 h-8">
              {moodDistributionData.map((item, i) => (
                <div 
                  key={i}
                  className="rounded transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: item.color, 
                    flex: item.value,
                    minWidth: item.value > 0 ? '8px' : '0'
                  }}
                  title={`${item.name}: ${item.value}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {moodDistributionData.map((item, i) => (
                <div key={i} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Mood vs Spending */}
        <Card className="shadow-lg" data-testid="card-mood-spending">
          <CardHeader>
            <CardTitle>Mood vs Spending</CardTitle>
            <CardDescription>Average daily spending by mood</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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
          <CardContent className="h-[300px]">
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

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Life Balance Radar */}
        <Card className="shadow-lg" data-testid="card-life-balance">
          <CardHeader>
            <CardTitle>Life Balance</CardTitle>
            <CardDescription>Overview of all life areas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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
      </div>

      {/* Weekly Mood Trend */}
      <Card className="shadow-lg mb-8" data-testid="card-weekly-mood">
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
    </Shell>
  );
}
