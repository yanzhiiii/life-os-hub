import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Book, 
  PieChart, 
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout, useUser } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: CheckSquare, label: "Productivity", href: "/productivity" },
  { icon: CalendarIcon, label: "Calendar", href: "/calendar" },
  { icon: DollarSign, label: "Finance", href: "/finance" },
  { icon: Book, label: "Journal", href: "/journal" },
  { icon: PieChart, label: "Insights", href: "/insights" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();

  return (
    <div className="w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl h-screen flex flex-col fixed left-0 top-0 z-50 shadow-xl shadow-primary/5">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-br from-primary to-blue-600 bg-clip-text text-transparent font-display tracking-tight">
          Life OS
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
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">{user?.displayName || user?.username}</p>
            <button 
              onClick={() => logout()}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 mt-0.5"
            >
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
