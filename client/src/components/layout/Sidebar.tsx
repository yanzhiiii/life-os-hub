import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Book, 
  PieChart, 
  LogOut,
  User,
  Settings,
  Info,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout, useUser } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", testId: "nav-dashboard" },
  { icon: CheckSquare, label: "Productivity", href: "/productivity", testId: "nav-productivity" },
  { icon: CalendarIcon, label: "Calendar", href: "/calendar", testId: "nav-calendar" },
  { icon: DollarSign, label: "Finance", href: "/finance", testId: "nav-finance" },
  { icon: Book, label: "Journal", href: "/journal", testId: "nav-journal" },
  { icon: PieChart, label: "Insights", href: "/insights", testId: "nav-insights" },
  { icon: Settings, label: "Settings", href: "/settings", testId: "nav-settings" },
  { icon: Info, label: "About", href: "/about", testId: "nav-about" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();

  return (
    <div className="w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl h-screen flex flex-col fixed left-0 top-0 z-50 shadow-xl shadow-primary/5">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-br from-primary to-blue-600 bg-clip-text text-transparent font-display tracking-tight" data-testid="text-app-title">
          Life OS Hub
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              data-testid={item.testId}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30" data-testid="card-user-profile">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate" data-testid="text-username">{user?.displayName || user?.username}</p>
            <button 
              onClick={() => logout()}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 mt-0.5"
              data-testid="button-logout"
            >
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const mobileNavItems = [
  { icon: LayoutDashboard, label: "Home", href: "/", testId: "mobile-nav-dashboard" },
  { icon: CheckSquare, label: "Tasks", href: "/productivity", testId: "mobile-nav-productivity" },
  { icon: CalendarIcon, label: "Calendar", href: "/calendar", testId: "mobile-nav-calendar" },
  { icon: DollarSign, label: "Finance", href: "/finance", testId: "mobile-nav-finance" },
  { icon: Menu, label: "More", href: "#more", testId: "mobile-nav-more" },
];

export function MobileNav() {
  const [location, setLocation] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();

  const handleNavClick = (href: string) => {
    if (href === "#more") {
      setSheetOpen(true);
    } else {
      setLocation(href);
    }
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {mobileNavItems.map((item) => {
            const isActive = item.href === "#more" ? false : location === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[60px]",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground"
                )}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
          <div className="py-4 space-y-2">
            <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-secondary/30">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-semibold">{user?.displayName || user?.username}</p>
                <p className="text-xs text-muted-foreground">Life OS Hub</p>
              </div>
            </div>

            {menuItems.filter(item => !["/", "/productivity", "/calendar", "/finance"].includes(item.href)).map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    setLocation(item.href);
                    setSheetOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                  data-testid={`mobile-${item.testId}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                logout();
                setSheetOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
              data-testid="mobile-button-logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>

            <div className="pt-4 mt-4 border-t border-border/30">
              <p className="text-center text-xs text-muted-foreground">
                © 2026 Edric Kristian L. Gantes. All rights reserved.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
