import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useRoutines, useRoutineCompletions } from "@/hooks/use-routines";
import { useTransactions } from "@/hooks/use-finance";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Circle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: tasks } = useTasks();
  const { data: transactions } = useTransactions();
  const { data: routines } = useRoutines();
  const today = format(new Date(), "yyyy-MM-dd");

  const pendingTasks = tasks?.filter(t => t.status !== "done").slice(0, 5) || [];
  
  // Calculate finance summary
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const balance = totalIncome - totalExpense;

  // Mock chart data
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
            <h1 className="text-3xl font-display font-bold">Good Morning, {user?.displayName || user?.username}</h1>
            <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
          </div>
          <div className="flex gap-4">
            {/* Weather widget placeholder - could be real API later */}
            <div className="bg-card px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2">
              <span className="text-2xl">⛅</span>
              <div>
                <div className="font-bold">72°F</div>
                <div className="text-xs text-muted-foreground">Partly Cloudy</div>
              </div>
            </div>
          </div>
        </header>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg shadow-blue-500/5 border-l-4 border-l-blue-500 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {balance > 0 ? <ArrowUpRight className="text-green-500 w-3 h-3"/> : <ArrowDownRight className="text-red-500 w-3 h-3"/>}
                from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg shadow-purple-500/5 border-l-4 border-l-purple-500 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {tasks?.filter(t => t.status === 'done').length} completed today
              </p>
            </CardContent>
          </Card>

           <Card className="shadow-lg shadow-green-500/5 border-l-4 border-l-green-500 card-hover">
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

          <Card className="shadow-lg shadow-orange-500/5 border-l-4 border-l-orange-500 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Payday</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 Days</div>
              <p className="text-xs text-muted-foreground mt-1">Oct 15th, 2025</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Split */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Tasks & Routines */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Today's Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group">
                      <button className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                        <Circle className="w-5 h-5" />
                      </button>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{task.title}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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

          {/* Right Column: Quick Routine Check */}
          <div className="space-y-8">
            <Card className="shadow-md h-full bg-gradient-to-br from-card to-secondary/20">
              <CardHeader>
                <CardTitle>Daily Routines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {routines?.map(routine => (
                  <div key={routine.id} className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{routine.title}</h4>
                    <div className="space-y-2">
                      {routine.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded border border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors">
                            {/* Logic to check completion would go here */}
                          </div>
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
