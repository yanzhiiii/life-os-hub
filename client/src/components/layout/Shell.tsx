import { Sidebar } from "./Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="hidden md:block w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <ScrollArea className="flex-1 h-screen">
        <main className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
          {children}
        </main>
        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border/30">
          © 2026 Edric Kristian L. Gantes. All rights reserved.
        </footer>
      </ScrollArea>
    </div>
  );
}
