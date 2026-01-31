import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useRoutines } from "@/hooks/use-routines";
import { useTransactions } from "@/hooks/use-finance";
import { useDayStatuses } from "@/hooks/use-day-statuses";
import { format, differenceInDays, addMonths, setDate, isBefore, startOfDay } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Circle, Briefcase, Coffee, Stethoscope, Palmtree, Clock, CalendarDays, Wallet } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number, currency: string = "PHP") => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getNextPayday = (paydayConfig: { type: string; dates?: number[] } | null | undefined) => {
  const today = startOfDay(new Date());
  const currentDay = today.getDate();
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
  working: { label: "Working Day", icon: Briefcase, color: "text-blue-600" },
  rest: { label: "Rest Day", icon: Coffee, color: "text-green-600" },
  sick_leave: { label: "Sick Leave", icon: Stethoscope, color: "text-red-600" },
  annual_leave: { label: "Annual Leave", icon: Palmtree, color: "text-amber-600" },
  custom: { label: "Custom", icon: Clock, color: "text-purple-600" },
};

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: tasks } = useTasks();
  const { data: transactions } = useTransactions();
  const { data: routines } = useRoutines();
  const { data: dayStatuses } = useDayStatuses();
  
  const today = format(new Date(), "yyyy-MM-dd");
  const currency = user?.currency || "PHP";
  const todayStatus = dayStatuses?.find(s => s.date === today);
  const statusInfo = dayStatusInfo[todayStatus?.status as keyof typeof dayStatusInfo] || dayStatusInfo.working;
  const StatusIcon = statusInfo.icon;

  const pendingTasks = tasks?.filter(t => t.status !== "done").slice(0, 5) || [];
  const completedToday = tasks?.filter(t => t.status === "done").length || 0;
  
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const balance = totalIncome - totalExpense;

  const nextPayday = getNextPayday(user?.paydayConfig);
  const daysUntilPayday = differenceInDays(nextPayday, startOfDay(new Date()));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const data = [
    { name: 'Mon', value: 40 },
    { name: 'Tue', value: 30 },
    { name: 'Wed', value: 60 },
    { name: 'Thu', value: 45 },
    { name: 'Fri', value: 70 },
    { name: 'Sat', value: 85 },
    { name: 'Sun', value: 75 },
  ];

  return (
    <Shell>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold" data-testid="text-greeting">
              {greeting}, {user?.displayName || user?.username}
            </h1>
            <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
          </div>
          <div className="flex gap-4">
            <div className={cn(
              "px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2",
              todayStatus?.status === "rest" && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
              todayStatus?.status === "working" && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
              todayStatus?.status === "sick_leave" && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
              todayStatus?.status === "annual_leave" && "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
            )} data-testid="card-today-status">
              <StatusIcon className={cn("w-5 h-5", statusInfo.color)} />
              <div>
                <div className="font-semibold text-sm">
                  {todayStatus?.status === "custom" ? todayStatus.customLabel : statusInfo.label}
                </div>
                <div className="text-xs text-muted-foreground">Today's Status</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg shadow-blue-500/5 border-l-4 border-l-blue-500 card-hover" data-testid="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(balance, currency)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {balance >= 0 ? (
                  <><ArrowUpRight className="text-green-500 w-3 h-3"/> Healthy</>
                ) : (
                  <><ArrowDownRight className="text-red-500 w-3 h-3"/> Negative</>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-purple-500/5 border-l-4 border-l-purple-500 card-hover" data-testid="card-tasks">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedToday} completed
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-green-500/5 border-l-4 border-l-green-500 card-hover" data-testid="card-productivity">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Productivity Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[85%] rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-orange-500/5 border-l-4 border-l-orange-500 card-hover" data-testid="card-payday">
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
                <CardTitle>Today's Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group" data-testid={`task-${task.id}`}>
                      <button className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                        <Circle className="w-5 h-5" />
                      </button>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{task.title}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            task.priority === "high" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                            task.priority === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                            task.priority === "low" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          )}>
                            {task.priority}
                          </span>
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
                <CardTitle>Productivity Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="shadow-md h-full bg-gradient-to-br from-card to-secondary/20">
              <CardHeader>
                <CardTitle>Daily Routines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {routines?.map(routine => (
                  <div key={routine.id} className="space-y-3" data-testid={`routine-${routine.id}`}>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{routine.title}</h4>
                    <div className="space-y-2">
                      {routine.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded border border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors">
                          </div>
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!routines || routines.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No routines set up yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
