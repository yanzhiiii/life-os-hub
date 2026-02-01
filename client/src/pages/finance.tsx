import { useState, createContext, useContext, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useTransactions, useCreateTransaction, useDebts, useCreateDebt, useDeleteDebt, useSavingsGoals, useCreateSavingsGoal, useDeleteSavingsGoal } from "@/hooks/use-finance";
import { useRecurringTemplates, useCreateRecurringTemplate, useDeleteRecurringTemplate } from "@/hooks/use-recurring-templates";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema, insertDebtSchema, insertSavingsGoalSchema, insertRecurringTemplateSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard, Link2, Trash2, CalendarDays, ChevronLeft, ChevronRight, DollarSign, BarChart3, Repeat, Eye, EyeOff } from "lucide-react";

// Privacy context for hiding financial amounts
const PrivacyContext = createContext<{ hideAmounts: boolean; toggleHide: () => void }>({
  hideAmounts: true,
  toggleHide: () => {}
});

const usePrivacy = () => useContext(PrivacyContext);
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, setDate, isAfter, isBefore, differenceInDays, addDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer as ReBarContainer, Tooltip as ReBarTooltip, Legend } from "recharts";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { cn } from "@/lib/utils";

const transactionSchema = insertTransactionSchema.extend({
  amount: z.coerce.number().min(0.01),
  date: z.coerce.date(),
});

const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'semimonthly_1_15', label: '1st & 15th' },
  { value: 'semimonthly_5_20', label: '5th & 20th' },
  { value: 'semimonthly_15_eom', label: '15th & End of Month' },
  { value: 'monthly', label: 'Monthly (same day)' },
  { value: 'everyN', label: 'Every N days' },
] as const;

const recurringSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1),
  frequency: z.enum(["once", "daily", "weekly", "biweekly", "semimonthly_1_15", "semimonthly_5_20", "semimonthly_15_eom", "monthly", "everyN"]),
  dayOfMonth: z.coerce.number().min(1).max(31).optional(),
  dayOfWeek: z.coerce.number().min(0).max(6).optional(),
  everyNDays: z.coerce.number().min(2).optional(),
  note: z.string().optional(),
});

type RecurringFormData = z.infer<typeof recurringSchema>;

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
  // Privacy mode - hide amounts by default, persist to localStorage
  const [hideAmounts, setHideAmounts] = useState(() => {
    const saved = localStorage.getItem('finance-privacy');
    return saved !== null ? JSON.parse(saved) : true; // Default to hidden
  });
  
  useEffect(() => {
    localStorage.setItem('finance-privacy', JSON.stringify(hideAmounts));
  }, [hideAmounts]);
  
  const toggleHide = () => setHideAmounts(!hideAmounts);
  
  return (
    <PrivacyContext.Provider value={{ hideAmounts, toggleHide }}>
    <Shell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Financial Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track income, expenses, debts, and savings goals.</p>
        </div>
        <Button 
          variant={hideAmounts ? "outline" : "secondary"} 
          size="sm"
          onClick={toggleHide}
          className="gap-2 self-start sm:self-auto"
          data-testid="button-toggle-privacy"
        >
          {hideAmounts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {hideAmounts ? "Show Amounts" : "Hide Amounts"}
        </Button>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-xl w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="transactions" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 min-w-[70px]" data-testid="tab-transactions">
            <Wallet className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Transactions</span><span className="sm:hidden">Trans</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 min-w-[70px]" data-testid="tab-finance-calendar">
            <CalendarDays className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Calendar</span><span className="sm:hidden">Cal</span>
          </TabsTrigger>
          <TabsTrigger value="debts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 min-w-[70px]" data-testid="tab-debts">
            <Link2 className="w-4 h-4 mr-1 sm:mr-2" />Debts
          </TabsTrigger>
          <TabsTrigger value="savings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 min-w-[70px]" data-testid="tab-savings">
            <PiggyBank className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Savings</span><span className="sm:hidden">Save</span>
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
    </PrivacyContext.Provider>
  );
}

function TransactionsView() {
  const { data: transactions } = useTransactions();
  const { data: user } = useUser();
  const { mutate: createTransaction } = useCreateTransaction();
  const [isOpen, setIsOpen] = useState(false);
  const currency = user?.currency || "PHP";
  const privateCurrency = usePrivateCurrency();

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
    createTransaction({ ...data, amount: String(data.amount) }, {
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
                <h3 className="text-3xl font-bold mt-2">{privateCurrency(income, currency)}</h3>
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
                <h3 className="text-3xl font-bold mt-2">{privateCurrency(expense, currency)}</h3>
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
                <h3 className="text-3xl font-bold mt-2">{privateCurrency(income - expense, currency)}</h3>
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
                      {t.type === 'income' ? '+' : '-'}{privateCurrency(Number(t.amount), currency)}
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
  const { mutate: deleteDebt } = useDeleteDebt();
  const [isOpen, setIsOpen] = useState(false);
  const currency = user?.currency || "PHP";
  const privateCurrency = usePrivateCurrency();

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
            <p className="text-2xl font-bold">{privateCurrency(totalDebt, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paid Off</p>
            <p className="text-2xl font-bold text-green-600">{privateCurrency(totalPaid, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-2xl font-bold text-red-600">{privateCurrency(totalRemaining, currency)}</p>
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-600">{progress.toFixed(0)}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDebt(debt.id)}
                      data-testid={`button-delete-debt-${debt.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
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
                    <span className="font-medium">{privateCurrency(Number(debt.totalAmount), currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-red-600">{privateCurrency(Number(debt.remainingAmount), currency)}</span>
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
  const { mutate: deleteSavings } = useDeleteSavingsGoal();
  const [isOpen, setIsOpen] = useState(false);
  const currency = user?.currency || "PHP";
  const privateCurrency = usePrivateCurrency();

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
            <p className="text-2xl font-bold">{privateCurrency(totalTarget, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Saved</p>
            <p className="text-2xl font-bold text-green-600">{privateCurrency(totalSaved, currency)}</p>
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-600">{progress.toFixed(0)}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSavings(goal.id)}
                      data-testid={`button-delete-savings-${goal.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
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
                    <span className="text-2xl font-bold">{privateCurrency(Number(goal.currentAmount || 0), currency)}</span>
                    <span className="text-muted-foreground"> / {privateCurrency(Number(goal.targetAmount), currency)}</span>
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

// Privacy-aware currency formatter - shows asterisks when hidden
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

const usePrivateCurrency = () => {
  const { hideAmounts } = usePrivacy();
  
  return (amount: number, currency: string = "PHP") => {
    return maskCurrency(amount, currency, hideAmounts);
  };
};

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Rent', 'Utilities', 'Internet', 'Laundry', 'Entertainment', 'Shopping', 'Health', 'Other'];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function FinanceCalendarView() {
  const { data: transactions } = useTransactions();
  const { data: user } = useUser();
  const { data: recurringTemplates } = useRecurringTemplates();
  const { mutate: createRecurring, isPending: isCreating } = useCreateRecurringTemplate();
  const { mutate: deleteRecurring } = useDeleteRecurringTemplate();
  const { mutate: createTransaction, isPending: isCreatingTx } = useCreateTransaction();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const privateCurrency = usePrivateCurrency();
  const { hideAmounts } = usePrivacy();
  
  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      category: "Food",
      date: new Date(),
      note: ""
    }
  });
  
  const onSubmitTransaction = (data: z.infer<typeof transactionSchema>) => {
    createTransaction({ ...data, amount: String(data.amount) }, {
      onSuccess: () => {
        setShowTransactionDialog(false);
        transactionForm.reset();
      }
    });
  };
  
  const recurringForm = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      name: '',
      type: 'expense',
      amount: 0,
      category: 'Food',
      frequency: 'monthly',
      dayOfMonth: 15,
      dayOfWeek: 1,
      everyNDays: 7,
      note: '',
    },
  });
  
  const watchFrequency = recurringForm.watch('frequency');
  
  const onSubmitRecurring = (data: RecurringFormData) => {
    createRecurring({
      name: data.name,
      type: data.type,
      amount: String(data.amount),
      category: data.category,
      frequency: data.frequency,
      dayOfMonth: data.frequency === 'monthly' ? data.dayOfMonth : undefined,
      dayOfWeek: data.frequency === 'weekly' || data.frequency === 'biweekly' ? data.dayOfWeek : undefined,
      everyNDays: data.frequency === 'everyN' ? data.everyNDays : undefined,
      note: data.note || undefined,
      startDate: new Date(),
      isActive: true,
    });
    setShowRecurringDialog(false);
    recurringForm.reset();
  };
  
  
  const occursOn = (template: any, day: Date, startDate: Date) => {
    const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    const templateEnd = template.endDate ? new Date(template.endDate) : null;
    const e = templateEnd ? new Date(templateEnd.getFullYear(), templateEnd.getMonth(), templateEnd.getDate()) : null;
    
    if (d < s || (e && d > e)) return false;
    if (!template.isActive) return false;
    
    const dayNum = d.getDate();
    const dayOfWeek = d.getDay();
    const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    
    switch (template.frequency) {
      case 'once':
        return d.getTime() === s.getTime();
      case 'daily':
        return true;
      case 'weekly':
        return dayOfWeek === template.dayOfWeek;
      case 'biweekly': {
        const diffDays = Math.floor((d.getTime() - s.getTime()) / 86400000);
        return dayOfWeek === s.getDay() && diffDays % 14 === 0;
      }
      case 'semimonthly_1_15':
        return dayNum === 1 || dayNum === 15;
      case 'semimonthly_5_20':
        return dayNum === 5 || dayNum === 20;
      case 'semimonthly_15_eom': {
        const isEndOfMonth = dayNum === 30 || (lastDayOfMonth < 30 && dayNum === lastDayOfMonth);
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
  
  // Calculate actual transactions for the month
  const actualMonthIncome = transactions?.filter(t => {
    const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
    return isSameMonth(txDate, currentMonth) && t.type === 'income';
  }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  
  const actualMonthExpense = transactions?.filter(t => {
    const txDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
    return isSameMonth(txDate, currentMonth) && t.type === 'expense';
  }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  
  // Calculate recurring templates for the month
  const getRecurringForMonth = () => {
    let recurringIncome = 0;
    let recurringExpense = 0;
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    for (const day of daysInMonth) {
      const recurringForDay = (recurringTemplates || []).filter(r => {
        const startDate = typeof r.startDate === 'string' ? parseISO(r.startDate) : new Date(r.startDate);
        return occursOn(r, day, startDate);
      });
      
      recurringIncome += recurringForDay.filter(r => r.type === 'income').reduce((acc, r) => acc + Number(r.amount), 0);
      recurringExpense += recurringForDay.filter(r => r.type === 'expense').reduce((acc, r) => acc + Number(r.amount), 0);
    }
    
    return { recurringIncome, recurringExpense };
  };
  
  const { recurringIncome, recurringExpense } = getRecurringForMonth();
  const monthIncome = actualMonthIncome + recurringIncome;
  const monthExpense = actualMonthExpense + recurringExpense;
  
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
  
  // Calculate current balance from all transactions (income - expenses)
  const allTimeIncome = (transactions || []).filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const allTimeExpense = (transactions || []).filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const currentBalance = allTimeIncome - allTimeExpense;
  
  const computeProjectedBalances = () => {
    const balances: Map<string, { balance: number; income: number; expense: number; items: any[] }> = new Map();
    
    // Calculate balance up to the start of current month from actual transactions
    const transactionsBeforeMonth = (transactions || []).filter(t => {
      const tDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
      return tDate < monthStart;
    });
    const incomeBeforeMonth = transactionsBeforeMonth.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expenseBeforeMonth = transactionsBeforeMonth.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
    let running = incomeBeforeMonth - expenseBeforeMonth;
    
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    for (const day of allDays) {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayTransactions = getTransactionsForDay(day);
      const actualIncome = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
      const actualExpense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
      
      const recurringForDay = (recurringTemplates || []).filter(r => {
        const startDate = typeof r.startDate === 'string' ? parseISO(r.startDate) : new Date(r.startDate);
        return occursOn(r, day, startDate);
      });
      
      const projectedIncome = recurringForDay.filter(r => r.type === 'income').reduce((acc, r) => acc + Number(r.amount), 0);
      const projectedExpense = recurringForDay.filter(r => r.type === 'expense').reduce((acc, r) => acc + Number(r.amount), 0);
      
      const totalIncome = actualIncome + projectedIncome;
      const totalExpense = actualExpense + projectedExpense;
      
      running = running + totalIncome - totalExpense;
      
      balances.set(dayStr, {
        balance: running,
        income: totalIncome,
        expense: totalExpense,
        items: recurringForDay
      });
    }
    
    return balances;
  };
  
  const projectedBalances = computeProjectedBalances();
  
  const projectedEndBalance = Array.from(projectedBalances.values()).pop()?.balance ?? currentBalance;
  
  const getPayoutPeriodStats = () => {
    if (paydayDates.length < 2) return [];
    
    const sortedDates = [...paydayDates].sort((a, b) => a - b);
    const periods: { 
      label: string; 
      income: number; 
      expense: number; 
      net: number; 
      expensesByCategory: Record<string, number> 
    }[] = [];
    
    for (let i = 0; i < sortedDates.length; i++) {
      const startDay = sortedDates[i];
      const endDay = i === sortedDates.length - 1 ? sortedDates[0] : sortedDates[i + 1];
      const isLastPeriod = i === sortedDates.length - 1;
      
      const lastDayOfMonth = endOfMonth(currentMonth).getDate();
      const actualStartDay = Math.min(startDay, lastDayOfMonth);
      const actualEndDay = isLastPeriod ? lastDayOfMonth : Math.min(endDay - 1, lastDayOfMonth);
      
      let periodIncome = 0;
      let periodExpense = 0;
      const expensesByCategory: Record<string, number> = {};
      
      for (let d = actualStartDay; d <= actualEndDay; d++) {
        const dayStr = format(setDate(currentMonth, d), "yyyy-MM-dd");
        const dayData = projectedBalances.get(dayStr);
        if (dayData) {
          periodIncome += dayData.income;
          periodExpense += dayData.expense;
          
          dayData.items.filter(item => item.type === 'expense').forEach(item => {
            const cat = item.category || 'Other';
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(item.amount);
          });
        }
      }
      
      periods.push({
        label: `${actualStartDay}${actualStartDay === 1 ? 'st' : actualStartDay === 2 ? 'nd' : actualStartDay === 3 ? 'rd' : 'th'} - ${actualEndDay}${actualEndDay === 1 ? 'st' : actualEndDay === 2 ? 'nd' : actualEndDay === 3 ? 'rd' : 'th'}`,
        income: periodIncome,
        expense: periodExpense,
        net: periodIncome - periodExpense,
        expensesByCategory
      });
    }
    
    return periods;
  };
  
  const payoutPeriodStats = getPayoutPeriodStats();
  
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
      <Card className="shadow-md" data-testid="card-balance-summary">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Current Balance:</span>
              <span className={cn("text-xl font-bold", currentBalance >= 0 ? "text-green-600" : "text-red-600")} data-testid="text-current-balance">
                {privateCurrency(currentBalance, currency)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Projected End of Month:</span>
              <span className={cn("text-xl font-bold", projectedEndBalance >= 0 ? "text-green-600" : "text-red-600")} data-testid="text-projected-balance">
                {privateCurrency(projectedEndBalance, currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          data-testid="button-prev-month"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>
        <h2 className="text-xl font-bold" data-testid="text-current-month">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          {!isSameMonth(currentMonth, new Date()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              data-testid="button-today-month"
            >
              Today
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            data-testid="button-next-month"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 font-medium">Monthly Income</p>
                <h3 className="text-3xl font-bold mt-2">{privateCurrency(monthIncome, currency)}</h3>
                {recurringIncome > 0 && (
                  <p className="text-xs text-white/70 mt-1">Includes {privateCurrency(recurringIncome, currency)} recurring</p>
                )}
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
                <h3 className="text-3xl font-bold mt-2">{privateCurrency(monthExpense, currency)}</h3>
                {recurringExpense > 0 && (
                  <p className="text-xs text-white/70 mt-1">Includes {privateCurrency(recurringExpense, currency)} recurring</p>
                )}
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
                <h3 className="text-3xl font-bold mt-2">{privateCurrency(monthIncome - monthExpense, currency)}</h3>
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
                <p className="text-2xl font-bold text-red-600">{privateCurrency(currentPeriod.spent, currency)}</p>
                <p className="text-xs text-muted-foreground">total expenses</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Daily Average</p>
                <p className="text-2xl font-bold text-blue-600">
                  {privateCurrency(currentPeriod.daysPassed > 0 ? currentPeriod.spent / currentPeriod.daysPassed : 0, currency)}
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
                  formatter={(value: number) => maskCurrency(value, currency, hideAmounts)}
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
      
      {payoutPeriodStats.length > 0 && (
        <Card className="shadow-md" data-testid="card-payout-stats">
          <CardHeader>
            <CardTitle className="text-lg">Payout Period Statistics</CardTitle>
            <CardDescription>Projected income, expenses, and net by pay period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {payoutPeriodStats.map((period, idx) => {
                const categoryData = Object.entries(period.expensesByCategory)
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value);
                const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFA07A', '#87CEEB', '#DDA0DD', '#98D8C8'];
                
                return (
                  <div key={idx} className="space-y-4 p-4 rounded-xl bg-secondary/30" data-testid={`payout-period-${idx}`}>
                    <h4 className="font-semibold text-center">{`Period ${idx + 1} (${period.label})`}</h4>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <p className="text-[10px] text-muted-foreground">Income</p>
                        <p className="text-sm font-bold text-green-600">{privateCurrency(period.income, currency)}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <p className="text-[10px] text-muted-foreground">Expenses</p>
                        <p className="text-sm font-bold text-red-600">{privateCurrency(period.expense, currency)}</p>
                      </div>
                      <div className={cn(
                        "p-2 rounded-lg",
                        period.net >= 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-orange-50 dark:bg-orange-900/20"
                      )}>
                        <p className="text-[10px] text-muted-foreground">Net</p>
                        <p className={cn(
                          "text-sm font-bold",
                          period.net >= 0 ? "text-blue-600" : "text-orange-600"
                        )}>{privateCurrency(period.net, currency)}</p>
                      </div>
                    </div>
                    
                    {categoryData.length > 0 && (
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {categoryData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <ReTooltip
                              formatter={(value: number) => maskCurrency(value, currency, hideAmounts)}
                              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {categoryData.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center text-[10px]">
                        {categoryData.slice(0, 5).map((cat, catIdx) => (
                          <div key={cat.name} className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: CHART_COLORS[catIdx % CHART_COLORS.length] }}
                            />
                            <span className="text-muted-foreground">{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-2">
                <Dialog open={showTransactionDialog} onOpenChange={(open) => {
                  setShowTransactionDialog(open);
                  if (open && selectedDate) {
                    transactionForm.setValue("date", selectedDate);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5" data-testid="button-add-transaction">
                      <Plus className="w-4 h-4" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Transaction{selectedDate ? ` for ${format(selectedDate, "MMMM d, yyyy")}` : ""}</DialogTitle>
                    </DialogHeader>
                    <Form {...transactionForm}>
                      <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-4 pt-4">
                        <FormField
                          control={transactionForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-tx-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="income">Income</SelectItem>
                                  <SelectItem value="expense">Expense</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={transactionForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" {...field} data-testid="input-tx-amount" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={transactionForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-tx-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {EXPENSE_CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={transactionForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  value={field.value instanceof Date ? format(field.value, "yyyy-MM-dd") : ""}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                  data-testid="input-tx-date"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={transactionForm.control}
                          name="note"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Note (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Groceries" {...field} value={field.value || ""} data-testid="input-tx-note" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={isCreatingTx} data-testid="button-save-tx">
                          {isCreatingTx ? 'Saving...' : 'Save Transaction'}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5" data-testid="button-add-recurring">
                      <Repeat className="w-4 h-4" />
                      Recurring
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Recurring Transaction</DialogTitle>
                    </DialogHeader>
                    <Form {...recurringForm}>
                      <form onSubmit={recurringForm.handleSubmit(onSubmitRecurring)} className="space-y-4 pt-4">
                        <FormField
                          control={recurringForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Internet Bill" {...field} data-testid="input-recurring-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={recurringForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-recurring-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="expense">Expense</SelectItem>
                                    <SelectItem value="income">Income</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={recurringForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="0" {...field} data-testid="input-recurring-amount" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={recurringForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-recurring-category">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {EXPENSE_CATEGORIES.map(cat => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={recurringForm.control}
                            name="frequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-recurring-frequency">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {FREQUENCY_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {watchFrequency === 'monthly' && (
                          <FormField
                            control={recurringForm.control}
                            name="dayOfMonth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Day of Month</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} max={31} {...field} data-testid="input-recurring-day" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {(watchFrequency === 'weekly' || watchFrequency === 'biweekly') && (
                          <FormField
                            control={recurringForm.control}
                            name="dayOfWeek"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Day of Week</FormLabel>
                                <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-recurring-weekday">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {DAYS_OF_WEEK.map((day, i) => (
                                      <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {watchFrequency === 'everyN' && (
                          <FormField
                            control={recurringForm.control}
                            name="everyNDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Every N Days</FormLabel>
                                <FormControl>
                                  <Input type="number" min={2} placeholder="e.g., 7" {...field} data-testid="input-recurring-every-n" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={recurringForm.control}
                          name="note"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Note (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Utility bill" {...field} data-testid="input-recurring-note" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={isCreating} data-testid="button-save-recurring">
                          {isCreating ? 'Saving...' : 'Save Recurring Transaction'}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div key={i} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-20" />
                ))}
                {calendarDays.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayOfMonth = day.getDate();
                  const summary = getDaySummary(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const hasTransactions = summary.transactions.length > 0;
                  const isPayday = paydayDates.includes(dayOfMonth);
                  
                  const dayProjection = projectedBalances.get(dateStr);
                  const projectedBalance = dayProjection?.balance ?? 0;
                  const recurringForDay = dayProjection?.items || [];
                  const projectedExpense = recurringForDay.filter((r: any) => r.type === 'expense').reduce((acc: number, r: any) => acc + Number(r.amount), 0);
                  const projectedIncome = recurringForDay.filter((r: any) => r.type === 'income').reduce((acc: number, r: any) => acc + Number(r.amount), 0);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "h-24 p-1.5 rounded-lg text-xs transition-all relative flex flex-col items-start justify-start border",
                        isToday && "ring-2 ring-primary ring-offset-1",
                        isSelected && "bg-primary/10 border-primary",
                        isPayday && !isSelected && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
                        !isSelected && !isPayday && "border-transparent hover:border-primary/30 hover:bg-secondary/30"
                      )}
                      data-testid={`finance-day-${dateStr}`}
                    >
                      <div className="flex items-center justify-between w-full mb-0.5">
                        <span className={cn(
                          "font-semibold text-sm",
                          isToday && "text-primary",
                          isPayday && "text-yellow-600 dark:text-yellow-400"
                        )}>{format(day, "d")}</span>
                        {isPayday && (
                          <DollarSign className="w-3 h-3 text-yellow-600" />
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-0.5 w-full flex-1 overflow-hidden">
                        {recurringForDay.length > 0 && (
                          <div className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 truncate">
                            <Repeat className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{recurringForDay.length} bill{recurringForDay.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        
                        {(projectedIncome > 0 || projectedExpense > 0) && (
                          <div className="flex gap-1 text-[10px]">
                            {projectedIncome > 0 && (
                              <span className="text-green-600 font-medium">+{projectedIncome >= 1000 ? `${(projectedIncome/1000).toFixed(0)}k` : projectedIncome}</span>
                            )}
                            {projectedExpense > 0 && (
                              <span className="text-red-600 font-medium">-{projectedExpense >= 1000 ? `${(projectedExpense/1000).toFixed(0)}k` : projectedExpense}</span>
                            )}
                          </div>
                        )}
                        
                        {hasTransactions && (
                          <div className="flex gap-1 text-[10px]">
                            {summary.income > 0 && (
                              <span className="text-green-600 font-bold">+{summary.income >= 1000 ? `${(summary.income/1000).toFixed(0)}k` : summary.income}</span>
                            )}
                            {summary.expense > 0 && (
                              <span className="text-red-600 font-bold">-{summary.expense >= 1000 ? `${(summary.expense/1000).toFixed(0)}k` : summary.expense}</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className={cn(
                        "w-full text-center mt-auto pt-0.5 border-t text-[10px] font-semibold",
                        projectedBalance >= 0 ? "text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" : "text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                      )}>
                        {projectedBalance >= 0 ? '' : ''}{projectedBalance >= 1000 || projectedBalance <= -1000 
                          ? `${(projectedBalance/1000).toFixed(1)}k` 
                          : projectedBalance.toFixed(0)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-4">
              <Card className="shadow-sm border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a Date"}
                  </CardTitle>
                  {selectedDate && paydayDates.includes(selectedDate.getDate()) && (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 w-fit">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Payday
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 pb-3 border-b">
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-[10px] text-muted-foreground">Income</p>
                          <p className="text-sm font-bold text-green-600">{privateCurrency(getDaySummary(selectedDate).income, currency)}</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-[10px] text-muted-foreground">Expenses</p>
                          <p className="text-sm font-bold text-red-600">{privateCurrency(getDaySummary(selectedDate).expense, currency)}</p>
                        </div>
                      </div>
                      
                      {(() => {
                        const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
                        const selectedDayProjection = projectedBalances.get(selectedDateStr);
                        const recurring = selectedDayProjection?.items || [];
                        const selectedProjectedBalance = selectedDayProjection?.balance ?? currentBalance;
                        
                        const getFrequencyLabel = (r: any) => {
                          const opt = FREQUENCY_OPTIONS.find(o => o.value === r.frequency);
                          if (r.frequency === 'weekly' || r.frequency === 'biweekly') {
                            return `${opt?.label || r.frequency} (${DAYS_OF_WEEK[r.dayOfWeek || 0]})`;
                          }
                          if (r.frequency === 'monthly') {
                            return `${opt?.label || 'Monthly'} (Day ${r.dayOfMonth})`;
                          }
                          if (r.frequency === 'everyN') {
                            return `Every ${r.everyNDays} days`;
                          }
                          return opt?.label || r.frequency;
                        };
                        
                        return (
                          <>
                            <div className="text-center p-3 mb-3 rounded-lg bg-secondary/50">
                              <p className="text-xs text-muted-foreground mb-1">Projected Balance</p>
                              <p className={cn(
                                "text-xl font-bold",
                                selectedProjectedBalance >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {privateCurrency(selectedProjectedBalance, currency)}
                              </p>
                            </div>
                            
                            {recurring.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Recurring Bills</p>
                                {recurring.map((r: any) => (
                                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Repeat className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{r.name || r.category}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {r.category} • {getFrequencyLabel(r)}
                                        </p>
                                      </div>
                                    </div>
                                    <span className={cn(
                                      "font-bold text-xs flex-shrink-0",
                                      r.type === 'income' ? "text-green-600" : "text-red-600"
                                    )}>
                                      {r.type === 'income' ? '+' : '-'}{privateCurrency(Number(r.amount), currency)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      
                      {getDaySummary(selectedDate).transactions.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          <p className="text-xs font-medium text-muted-foreground">Transactions</p>
                          {getDaySummary(selectedDate).transactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30" data-testid={`finance-tx-${t.id}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={cn(
                                  "p-1.5 rounded-lg flex-shrink-0",
                                  t.type === 'income' ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                                )}>
                                  {t.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-xs truncate">{t.category}</p>
                                  {t.note && <p className="text-[10px] text-muted-foreground truncate">{t.note}</p>}
                                </div>
                              </div>
                              <span className={cn(
                                "font-bold text-xs flex-shrink-0",
                                t.type === 'income' ? "text-green-600" : "text-red-600"
                              )}>
                                {t.type === 'income' ? '+' : '-'}{privateCurrency(Number(t.amount), currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No transactions
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select a date to see details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Recurring Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(recurringTemplates || []).length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {(recurringTemplates || []).filter(r => r.isActive).map(r => (
                        <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30" data-testid={`recurring-${r.id}`}>
                          <div className="min-w-0">
                            <p className="font-medium text-xs truncate">{r.name || r.category}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {r.frequency === 'weekly' ? `Every ${DAYS_OF_WEEK[r.dayOfWeek || 0]}` : `Day ${r.dayOfMonth}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-bold text-xs",
                              r.type === 'income' ? "text-green-600" : "text-red-600"
                            )}>
                              {privateCurrency(Number(r.amount), currency)}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => deleteRecurring(r.id)}
                              data-testid={`delete-recurring-${r.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No recurring templates</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
