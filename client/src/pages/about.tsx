import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, User, Heart, Layers } from "lucide-react";

export default function AboutPage() {
  return (
    <Shell>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-about-title">About Life OS Hub</h1>
          <p className="text-muted-foreground">A personal operating system for intentional living</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              What is Life OS Hub?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Life OS Hub is a personal operating system for life — a unified platform designed to help 
              individuals manage time, finances, habits, goals, and personal growth in one place. It was 
              created to reduce fragmentation across productivity tools and provide clarity, structure, 
              and intentional living.
            </p>
            <p>
              Rather than juggling multiple apps for different aspects of your life, Life OS Hub brings 
              everything together in a cohesive experience that helps you see the bigger picture.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              What "Life OS" Means
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              "Life OS" stands for <strong className="text-foreground">Life Operating System</strong>. Just as a computer's operating 
              system organizes hardware and software resources, Life OS Hub organizes the key domains of your life:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-foreground">Time</strong> — Calendar, events, and daily planning</li>
              <li><strong className="text-foreground">Money</strong> — Income, expenses, debts, and savings</li>
              <li><strong className="text-foreground">Energy</strong> — Routines and habit tracking</li>
              <li><strong className="text-foreground">Habits</strong> — Daily practices and streak monitoring</li>
              <li><strong className="text-foreground">Goals</strong> — Long-term objectives with milestones</li>
            </ul>
            <p>
              This is not about optimization for productivity alone. It's about alignment, sustainability, 
              and self-direction — building systems that support the life you want to live.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Why Life OS Hub Was Created
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Life OS Hub was built as a response to feeling overwhelmed by fragmented tools — separate 
              apps for calendars, finance tracking, notes, and habit monitoring. Each tool worked well 
              on its own, but together they created cognitive overhead and disconnected data.
            </p>
            <p>
              The goal behind Life OS Hub is to treat life like a system that can be observed, improved, 
              and maintained. Just like an operating system provides a foundation for everything else 
              to run smoothly, this platform provides a foundation for intentional living.
            </p>
            <p>
              It's about self-awareness, long-term growth, and creating clarity in a world that often 
              feels chaotic. Life OS Hub is a personal project built with care and purpose.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Developer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Edric Kristian L. Gantes</p>
              <p className="text-sm text-muted-foreground">Developer & Creator</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
