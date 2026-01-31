import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useUpdateUserSettings } from "@/hooks/use-user-settings";
import { User, CreditCard, Palette, LogOut, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const updateSettings = useUpdateUserSettings();
  const { toast } = useToast();
  
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [paydayType, setPaydayType] = useState<"fixed" | "custom" | "monthly" | "semiMonthly">("fixed");
  const [payDates, setPayDates] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setCurrency(user.currency || "PHP");
      setPaydayType(user.paydayConfig?.type || "fixed");
      setPayDates(user.paydayConfig?.dates?.join(", ") || "15, 30");
    }
  }, [user]);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const handleSave = () => {
    const dates = payDates.split(",").map(d => parseInt(d.trim())).filter(d => !isNaN(d));
    
    updateSettings.mutate({
      displayName: displayName || undefined,
      currency,
      paydayConfig: {
        type: paydayType,
        dates: dates.length > 0 ? dates : undefined,
      },
    }, {
      onSuccess: () => {
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Manage your account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    defaultValue={user?.username} 
                    disabled 
                    className="bg-secondary/50"
                    data-testid="input-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    data-testid="input-display-name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Payday Configuration</CardTitle>
                  <CardDescription>Set up your salary payout schedule</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Payday Type</Label>
                  <Select value={paydayType} onValueChange={(v) => setPaydayType(v as any)}>
                    <SelectTrigger data-testid="select-payday-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Dates (e.g., 15th & 30th)</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="semiMonthly">Semi-Monthly</SelectItem>
                      <SelectItem value="custom">Custom Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pay Dates</Label>
                  <Input 
                    placeholder="e.g., 15, 30" 
                    value={payDates}
                    onChange={(e) => setPayDates(e.target.value)}
                    data-testid="input-pay-dates"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated day numbers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Currency & Region</CardTitle>
                  <CardDescription>Set your preferred currency</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger data-testid="select-currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHP">PHP - Philippine Peso</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Palette className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <Switch 
                  checked={isDarkMode} 
                  onCheckedChange={toggleDarkMode}
                  data-testid="switch-dark-mode"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              className="px-8" 
              disabled={updateSettings.isPending}
              data-testid="button-save-settings"
            >
              {updateSettings.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{user?.displayName || user?.username}</p>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => logout()}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Life OS</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your all-in-one productivity, finance, and journaling companion.
              </p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
