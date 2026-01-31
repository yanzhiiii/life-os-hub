import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useTransactions, useCreateTransaction, useDebts, useCreateDebt, useSavingsGoals, useCreateSavingsGoal } from "@/hooks/use-finance";
import { useUser } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema, insertDebtSchema, insertSavingsGoalSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard, Link2, Trash2, CalendarDays, ChevronLeft, ChevronRight, DollarSign, BarChart3 } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, setDate, isAfter, isBefore, differenceInDays, addDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer as ReBarContainer, Tooltip as ReBarTooltip, Legend } from "recharts";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { cn } from "@/lib/utils";

const transactionSchema = insertTransactionSchema.extend({
  amount: z.coerce.number().min(0.01),
  date: z.coerce.date(),
});

const debtSchema = z.object({
  name: z.string().min(1),
  totalAmount: z.coerce.number().min(1),
  remainingAmount: z.coerce.number().min(0),
  dueDate: z.string().optional(),
  interestRate: z.coerce.number().optional(),
});

const savingsSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.coerce.number().min(1),
  currentAmount: z.coerce.number().min(0).default(0),
});

export default function Finance() {
  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Financial Overview</h1>
        <p className="text-muted-foreground">Track income, expenses, debts, and savings goals.</p>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="transactions" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-transactions">
            <Wallet className="w-4 h-4 mr-2" />Transactions
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-finance-calendar">
            <CalendarDays className="w-4 h-4 mr-2" />Calendar
          </TabsTrigger>
          <TabsTrigger value="debts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-debts">
            <Link2 className="w-4 h-4 mr-2" />Debts
          </TabsTrigger>
          <TabsTrigger value="savings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-savings">
            <PiggyBank className="w-4 h-4 mr-2" />Savings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TransactionsView />
        </TabsContent>

        <TabsContent value="calendar" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FinanceCalendarView />
        </TabsContent>

        <TabsContent value="debts" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DebtsView />
        </TabsContent>

        <TabsContent value="savings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SavingsView />
        </TabsContent>
      </Tabs>
    </Shell>
  );
}

function TransactionsView() {
  const { data: transactions } = useTransactions();
  const { data: user } = useUser();
  const { mutate: createTransaction } = useCreateTransaction();
  const [isOpen, setIsOpen] = useState(false);
  const currency = user?.currency || "PHP";

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      category: "Food",
      date: new Date(),
      note: ""
    }
  });

  const onSubmit = (data: z.infer<typeof transactionSchema>) => {
    createTransaction(data, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const income = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const expense = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;

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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/25" data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-2" /> Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Select onValueChange={(v) => form.setValue("type", v)} defaultValue="expense">
                  <SelectTrigger data-testid="select-tx-type">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" step="0.01" placeholder="Amount" {...form.register("amount")} data-testid="input-tx-amount" />
              </div>
              <Input placeholder="Category (e.g. Food, Rent)" {...form.register("category")} data-testid="input-tx-category" />
              <Input type="date" {...form.register("date")} data-testid="input-tx-date" />
              <Input placeholder="Note (optional)" {...form.register("note")} data-testid="input-tx-note" />
              <Button type="submit" className="w-full" data-testid="button-save-transaction">Save Transaction</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 font-medium">Total Income</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(income, currency)}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 font-medium">Total Expenses</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(expense, currency)}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 font-medium">Net Balance</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(income - expense, currency)}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions?.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors" data-testid={`card-transaction-${t.id}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                        {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{t.category}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(t.date), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), currency)}
                    </span>
                  </div>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions yet. Add your first one!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {categoryData.map((entry, index) => {
                    const total = categoryData.reduce((acc, e) => acc + e.value, 0);
                    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                    return (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span>{entry.name}</span>
                        </div>
                        <span className="font-medium">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No expense data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DebtsView() {
  const { data: debts } = useDebts();
  const { data: user } = useUser();
  const { mutate: createDebt } = useCreateDebt();
  const [isOpen, setIsOpen] = useState(false);
  const currency = user?.currency || "PHP";

  const form = useForm<z.infer<typeof debtSchema>>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: "",
      totalAmount: 0,
      remainingAmount: 0,
    }
  });

  const onSubmit = (data: z.infer<typeof debtSchema>) => {
    createDebt({
      ...data,
      totalAmount: String(data.totalAmount),
      remainingAmount: String(data.remainingAmount),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      interestRate: data.interestRate ? String(data.interestRate) : null,
    }, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const totalDebt = debts?.reduce((acc, d) => acc + Number(d.totalAmount), 0) || 0;
  const totalRemaining = debts?.reduce((acc, d) => acc + Number(d.remainingAmount), 0) || 0;
  const totalPaid = totalDebt - totalRemaining;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-8">
          <div>
            <p className="text-sm text-muted-foreground">Total Debt</p>
            <p className="text-2xl font-bold">{formatCurrency(totalDebt, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paid Off</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRemaining, currency)}</p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/25" data-testid="button-add-debt">
              <Plus className="w-4 h-4 mr-2" /> Add Debt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Debt</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <Input placeholder="Debt name (e.g., Credit Card)" {...form.register("name")} data-testid="input-debt-name" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Total Amount</label>
                  <Input type="number" step="0.01" {...form.register("totalAmount")} data-testid="input-debt-total" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Remaining</label>
                  <Input type="number" step="0.01" {...form.register("remainingAmount")} data-testid="input-debt-remaining" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Due Date</label>
                  <Input type="date" {...form.register("dueDate")} data-testid="input-debt-due" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Interest Rate %</label>
                  <Input type="number" step="0.01" {...form.register("interestRate")} data-testid="input-debt-interest" />
                </div>
              </div>
              <Button type="submit" className="w-full" data-testid="button-save-debt">Add Debt</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debts?.map((debt) => {
          const progress = ((Number(debt.totalAmount) - Number(debt.remainingAmount)) / Number(debt.totalAmount)) * 100;
          const chainLinks = 5;
          const brokenLinks = Math.floor((progress / 100) * chainLinks);
          
          return (
            <Card key={debt.id} className="shadow-lg overflow-hidden" data-testid={`card-debt-${debt.id}`}>
              <div className={cn(
                "h-2",
                progress >= 75 ? "bg-green-500" : progress >= 50 ? "bg-yellow-500" : "bg-red-500"
              )} style={{ width: `${progress}%` }} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <CreditCard className="w-5 h-5 text-red-600" />
                    </div>
                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                  </div>
                  <span className="text-sm font-bold text-green-600">{progress.toFixed(0)}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-2 mb-4">
                  {Array.from({ length: chainLinks }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-8 rounded-full border-4 transition-all",
                        i < brokenLinks 
                          ? "border-green-500 bg-green-100 dark:bg-green-900/30" 
                          : "border-gray-300 dark:border-gray-600"
                      )}
                    />
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{formatCurrency(Number(debt.totalAmount), currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-red-600">{formatCurrency(Number(debt.remainingAmount), currency)}</span>
                  </div>
                  {debt.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due</span>
                      <span className="font-medium">{format(new Date(debt.dueDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!debts || debts.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
            No debts tracked. Add one to start breaking free!
          </div>
        )}
      </div>
    </div>
  );
}

function SavingsView() {
  const { data: savings } = useSavingsGoals();
  const { data: user } = useUser();
  const { mutate: createSavings } = useCreateSavingsGoal();
  const [isOpen, setIsOpen] = useState(false);
  const currency = user?.currency || "PHP";

  const form = useForm<z.infer<typeof savingsSchema>>({
    resolver: zodResolver(savingsSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      currentAmount: 0,
    }
  });

  const onSubmit = (data: z.infer<typeof savingsSchema>) => {
    createSavings({
      name: data.name,
      targetAmount: String(data.targetAmount),
      currentAmount: String(data.currentAmount),
    }, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const totalTarget = savings?.reduce((acc, s) => acc + Number(s.targetAmount), 0) || 0;
  const totalSaved = savings?.reduce((acc, s) => acc + Number(s.currentAmount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-8">
          <div>
            <p className="text-sm text-muted-foreground">Total Goals</p>
            <p className="text-2xl font-bold">{formatCurrency(totalTarget, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Saved</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSaved, currency)}</p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/25" data-testid="button-add-savings">
              <Plus className="w-4 h-4 mr-2" /> New Savings Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <Input placeholder="Goal name (e.g., New Car)" {...form.register("name")} data-testid="input-savings-name" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Target Amount</label>
                  <Input type="number" step="0.01" {...form.register("targetAmount")} data-testid="input-savings-target" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Current Amount</label>
                  <Input type="number" step="0.01" {...form.register("currentAmount")} data-testid="input-savings-current" />
                </div>
              </div>
              <Button type="submit" className="w-full" data-testid="button-save-savings">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savings?.map((goal) => {
          const progress = Number(goal.targetAmount) > 0 
            ? (Number(goal.currentAmount || 0) / Number(goal.targetAmount)) * 100 
            : 0;
          const fillHeight = Math.min(progress, 100);
          
          return (
            <Card key={goal.id} className="shadow-lg" data-testid={`card-savings-${goal.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                  <span className="text-sm font-bold text-green-600">{progress.toFixed(0)}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <div className="relative w-24 h-32">
                    <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-b-3xl rounded-t-lg" />
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-emerald-400 rounded-b-3xl transition-all duration-500"
                      style={{ height: `${fillHeight}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PiggyBank className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-center">
                  <div>
                    <span className="text-2xl font-bold">{formatCurrency(Number(goal.currentAmount || 0), currency)}</span>
                    <span className="text-muted-foreground"> / {formatCurrency(Number(goal.targetAmount), currency)}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!savings || savings.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
            No savings goals yet. Start saving for something special!
          </div>
        )}
      </div>
    </div>
  );
}

const formatCurrency = (amount: number, currency: string = "PHP") => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

function FinanceCalendarView() {
  const { data: transactions } = useTransactions();
  const { data: user } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const currency = user?.currency || "PHP";
  const rawPaydayDates = user?.paydayConfig?.dates || [15, 30];
  const paydayDates = Array.from(new Set(rawPaydayDates)).filter(d => d >= 1 && d <= 31).sort((a, b) => a - b);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startPadding = monthStart.getDay();
  
  const getTransactionsForDay = (day: Date) => {
    if (!transactions) return [];
    const dayStr = format(day, "yyyy-MM-dd");
    return transactions.filter(t => {
      const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
      return format(txDate, "yyyy-MM-dd") === dayStr;
    });
  };
  
  const getDaySummary = (day: Date) => {
    const dayTransactions = getTransactionsForDay(day);
    const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
    return { income, expense, net: income - expense, transactions: dayTransactions };
  };
  
  const monthIncome = transactions?.filter(t => {
    const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
    return isSameMonth(txDate, currentMonth) && t.type === 'income';
  }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  
  const monthExpense = transactions?.filter(t => {
    const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
    return isSameMonth(txDate, currentMonth) && t.type === 'expense';
  }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  
  const getPayPeriods = () => {
    if (paydayDates.length === 0) return [];
    
    const sortedDates = [...paydayDates].sort((a, b) => a - b);
    const periods: { name: string; startDate: Date; endDate: Date; income: number; expense: number }[] = [];
    
    const clampDay = (month: Date, day: number) => {
      const maxDay = endOfMonth(month).getDate();
      return Math.min(day, maxDay);
    };
    
    for (let i = 0; i < sortedDates.length; i++) {
      const payday = clampDay(currentMonth, sortedDates[i]);
      const nextIdx = (i + 1) % sortedDates.length;
      const isLastPeriod = i === sortedDates.length - 1;
      const nextMonth = isLastPeriod ? addMonths(currentMonth, 1) : currentMonth;
      const nextPaydayClamped = clampDay(nextMonth, sortedDates[nextIdx]);
      
      let periodStart = setDate(currentMonth, payday);
      let periodEnd: Date;
      
      if (isLastPeriod) {
        periodEnd = addDays(setDate(nextMonth, nextPaydayClamped), -1);
      } else {
        periodEnd = addDays(setDate(currentMonth, nextPaydayClamped), -1);
      }
      
      if (isBefore(periodEnd, periodStart) || isSameDay(periodEnd, periodStart)) {
        continue;
      }
      
      if (!isSameMonth(periodStart, currentMonth) && !isSameMonth(periodEnd, currentMonth)) {
        continue;
      }
      
      const periodTransactions = transactions?.filter(t => {
        const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
        return !isBefore(txDate, periodStart) && !isAfter(txDate, periodEnd);
      }) || [];
      
      const income = periodTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
      const expense = periodTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
      
      periods.push({
        name: `${format(periodStart, "MMM d")} - ${format(periodEnd, "MMM d")}`,
        startDate: periodStart,
        endDate: periodEnd,
        income,
        expense
      });
    }
    
    return periods;
  };
  
  const payPeriods = getPayPeriods();
  
  const getCurrentPayPeriod = () => {
    const today = new Date();
    if (paydayDates.length === 0) return null;
    
    const sortedDates = [...paydayDates].sort((a, b) => a - b);
    
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const payday = setDate(today, Math.min(sortedDates[i], endOfMonth(today).getDate()));
      if (!isAfter(payday, today)) {
        const nextIdx = (i + 1) % sortedDates.length;
        const nextMonth = i === sortedDates.length - 1 ? addMonths(today, 1) : today;
        const nextPayday = setDate(nextMonth, Math.min(sortedDates[nextIdx], endOfMonth(nextMonth).getDate()));
        
        const daysInPeriod = Math.max(1, differenceInDays(nextPayday, payday));
        const daysPassed = differenceInDays(today, payday);
        const daysRemaining = differenceInDays(nextPayday, today);
        
        const periodTransactions = transactions?.filter(t => {
          const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
          return !isBefore(txDate, payday) && !isAfter(txDate, today);
        }) || [];
        
        const spent = periodTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        
        return {
          startDate: payday,
          endDate: nextPayday,
          daysInPeriod,
          daysPassed,
          daysRemaining,
          spent
        };
      }
    }
    
    const lastPaydayDate = sortedDates[sortedDates.length - 1];
    const prevMonth = subMonths(today, 1);
    const payday = setDate(prevMonth, Math.min(lastPaydayDate, endOfMonth(prevMonth).getDate()));
    const nextPayday = setDate(today, Math.min(sortedDates[0], endOfMonth(today).getDate()));
    
    const daysInPeriod = Math.max(1, differenceInDays(nextPayday, payday));
    const daysPassed = differenceInDays(today, payday);
    const daysRemaining = differenceInDays(nextPayday, today);
    
    const periodTransactions = transactions?.filter(t => {
      const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
      return !isBefore(txDate, payday) && !isAfter(txDate, today);
    }) || [];
    
    const spent = periodTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
    
    return {
      startDate: payday,
      endDate: nextPayday,
      daysInPeriod,
      daysPassed,
      daysRemaining,
      spent
    };
  };
  
  const currentPeriod = getCurrentPayPeriod();
  
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 font-medium">Monthly Income</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(monthIncome, currency)}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 font-medium">Monthly Expenses</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(monthExpense, currency)}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 font-medium">Net Balance</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(monthIncome - monthExpense, currency)}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {currentPeriod && (
        <Card className="shadow-md" data-testid="card-pay-period">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Current Pay Period</CardTitle>
                <CardDescription>
                  {format(currentPeriod.startDate, "MMM d")} - {format(currentPeriod.endDate, "MMM d, yyyy")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Days Passed</p>
                <p className="text-2xl font-bold">{currentPeriod.daysPassed}</p>
                <p className="text-xs text-muted-foreground">of {currentPeriod.daysInPeriod}</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                <p className="text-2xl font-bold text-primary">{currentPeriod.daysRemaining}</p>
                <p className="text-xs text-muted-foreground">until payday</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Spent This Period</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(currentPeriod.spent, currency)}</p>
                <p className="text-xs text-muted-foreground">total expenses</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Daily Average</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(currentPeriod.daysPassed > 0 ? currentPeriod.spent / currentPeriod.daysPassed : 0, currency)}
                </p>
                <p className="text-xs text-muted-foreground">per day</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Period Progress</span>
                <span className="font-medium">{Math.round((currentPeriod.daysPassed / currentPeriod.daysInPeriod) * 100)}%</span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                  style={{ width: `${(currentPeriod.daysPassed / currentPeriod.daysInPeriod) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {payPeriods.length > 0 && (
        <Card className="shadow-md" data-testid="card-pay-period-chart">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Pay Period Comparison</CardTitle>
                <CardDescription>Income vs Expenses by pay period</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ReBarContainer width="100%" height="100%">
              <BarChart data={payPeriods}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ReBarTooltip 
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ReBarContainer>
          </CardContent>
        </Card>
      )}
      
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="h-12" />
              ))}
              {calendarDays.map(day => {
                const summary = getDaySummary(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasTransactions = summary.transactions.length > 0;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "h-12 p-1 rounded text-xs transition-all relative flex flex-col items-center justify-start",
                      isToday && "ring-2 ring-primary",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && hasTransactions && "bg-secondary/30",
                      !isSelected && "hover:bg-secondary/50"
                    )}
                    data-testid={`finance-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <span className="font-medium text-sm">{format(day, "d")}</span>
                    {hasTransactions && (
                      <div className="flex flex-col items-center text-[9px] leading-tight">
                        {summary.income > 0 && (
                          <span className={cn(
                            "text-green-600",
                            isSelected && "text-green-200"
                          )}>
                            +{summary.income >= 1000 ? `${(summary.income/1000).toFixed(0)}k` : summary.income}
                          </span>
                        )}
                        {summary.expense > 0 && (
                          <span className={cn(
                            "text-red-600",
                            isSelected && "text-red-200"
                          )}>
                            -{summary.expense >= 1000 ? `${(summary.expense/1000).toFixed(0)}k` : summary.expense}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a Date"}
            </CardTitle>
            <CardDescription>
              {selectedDate ? "Transactions for this day" : "Click on a day to see details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                {(() => {
                  const summary = getDaySummary(selectedDate);
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-xs text-muted-foreground">Income</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(summary.income, currency)}</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-xs text-muted-foreground">Expenses</p>
                          <p className="text-lg font-bold text-red-600">{formatCurrency(summary.expense, currency)}</p>
                        </div>
                      </div>
                      
                      {summary.transactions.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {summary.transactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30" data-testid={`finance-tx-${t.id}`}>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  t.type === 'income' ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                                )}>
                                  {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{t.category}</p>
                                  {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
                                </div>
                              </div>
                              <span className={cn(
                                "font-bold",
                                t.type === 'income' ? "text-green-600" : "text-red-600"
                              )}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          No transactions for this day
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a date to view transactions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
