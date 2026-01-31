import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTasks } from "@/hooks/use-tasks";
import { useTransactions, useDebts, useSavingsGoals } from "@/hooks/use-finance";
import { useGoals } from "@/hooks/use-goals";
import { useRoutines, useRoutineCompletions } from "@/hooks/use-routines";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { TrendingUp, Target, CheckCircle2, PiggyBank, CreditCard, Flame } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function InsightsPage() {
  const { data: tasks } = useTasks();
  const { data: transactions } = useTransactions();
  const { data: debts } = useDebts();
  const { data: savings } = useSavingsGoals();
  const { data: goals } = useGoals();
  const { data: routines } = useRoutines();

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

  // Weekly task data (mock for visualization)
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date())
  });
  
  const weeklyTaskData = weekDays.map((day, i) => ({
    name: format(day, "EEE"),
    completed: Math.floor(Math.random() * 5) + 1,
    total: Math.floor(Math.random() * 3) + 3 + i,
  }));

  // Income vs Expense trend (mock)
  const trendData = Array.from({ length: 6 }, (_, i) => ({
    month: format(subDays(new Date(), (5 - i) * 30), "MMM"),
    income: 40000 + Math.random() * 20000,
    expense: 20000 + Math.random() * 15000,
  }));

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Insights</h1>
        <p className="text-muted-foreground">Track your progress across all areas of life.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className="text-2xl font-bold">${(totalIncome - totalExpense).toLocaleString()}</p>
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
                ${debtPaid.toLocaleString()} paid of ${totalDebt.toLocaleString()}
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
                ${totalSaved.toLocaleString()} saved of ${totalSavingsTarget.toLocaleString()}
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
    </Shell>
  );
}
