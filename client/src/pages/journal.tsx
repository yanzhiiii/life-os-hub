import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJournalEntries, useCreateJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from "@/hooks/use-journal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJournalEntrySchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, Pencil, Smile, Meh, Frown, Heart, Sparkles, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { cn } from "@/lib/utils";

const journalSchema = insertJournalEntrySchema.extend({
  date: z.string(),
  content: z.string().min(1, "Write something..."),
  mood: z.string().optional(),
});

const moods = [
  { value: "happy", icon: Smile, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
  { value: "neutral", icon: Meh, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  { value: "sad", icon: Frown, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { value: "excited", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
  { value: "grateful", icon: Heart, color: "text-pink-500", bg: "bg-pink-100 dark:bg-pink-900/30" },
];

export default function JournalPage() {
  const { data: entries, isLoading } = useJournalEntries();
  const { mutate: createEntry } = useCreateJournalEntry();
  const { mutate: updateEntry } = useUpdateJournalEntry();
  const { mutate: deleteEntry } = useDeleteJournalEntry();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{ id: number; date: string; content: string; mood?: string | null } | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>("neutral");
  const [repoMonth, setRepoMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const form = useForm<z.infer<typeof journalSchema>>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      content: "",
      mood: "neutral",
    }
  });

  const onSubmit = (data: z.infer<typeof journalSchema>) => {
    const payload = { ...data, mood: selectedMood };
    if (editingEntry) {
      updateEntry({ id: editingEntry.id, ...payload }, {
        onSuccess: () => {
          setIsOpen(false);
          setEditingEntry(null);
          setSelectedMood("neutral");
          form.reset();
        }
      });
    } else {
      createEntry(payload, {
        onSuccess: () => {
          setIsOpen(false);
          form.reset();
          setSelectedMood("neutral");
        }
      });
    }
  };

  const getMoodIcon = (mood?: string | null) => {
    const moodData = moods.find(m => m.value === mood) || moods[1];
    const Icon = moodData.icon;
    return <Icon className={cn("w-5 h-5", moodData.color)} />;
  };

  const latestEntry = entries?.[0] ?? null;
  const entriesByDate = useMemo(() => {
    const map: Record<string, { count: number; entry: (typeof entries)[0] }> = {};
    entries?.forEach((e) => {
      if (!map[e.date]) map[e.date] = { count: 0, entry: e };
      map[e.date].count += 1;
      map[e.date].entry = e;
    });
    return map;
  }, [entries]);

  const repoMonthStart = startOfMonth(repoMonth);
  const repoMonthEnd = endOfMonth(repoMonth);
  const repoDays = eachDayOfInterval({ start: repoMonthStart, end: repoMonthEnd });
  const repoStartPadding = getDay(repoMonthStart);
  const years = useMemo(() => Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  const openEdit = (entry: (typeof entries)[0]) => {
    setEditingEntry(entry);
    setSelectedMood(entry.mood || "neutral");
    form.reset({ date: entry.date, content: entry.content, mood: entry.mood || "neutral" });
    setIsOpen(true);
  };

  const entriesForSelectedDate = selectedDate ? (entries?.filter(e => e.date === selectedDate) ?? []) : [];

  return (
    <Shell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Journal</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Reflect on your thoughts and track your mood.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) setEditingEntry(null); setIsOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/25" onClick={() => setEditingEntry(null)} data-testid="button-new-entry">
              <Plus className="w-4 h-4 mr-2" /> New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Edit Journal Entry" : "Write Journal Entry"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <Input type="date" {...form.register("date")} className="text-lg" data-testid="input-entry-date" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-3 block">How are you feeling?</label>
                <div className="flex gap-3">
                  {moods.map((mood) => {
                    const Icon = mood.icon;
                    return (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setSelectedMood(mood.value)}
                        className={cn(
                          "p-3 rounded-xl transition-all",
                          selectedMood === mood.value ? cn(mood.bg, "ring-2 ring-offset-2 ring-primary") : "bg-secondary/50 hover:bg-secondary"
                        )}
                        data-testid={`button-mood-${mood.value}`}
                      >
                        <Icon className={cn("w-6 h-6", mood.color)} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <Textarea placeholder="What's on your mind today?" className="min-h-[200px] text-lg" {...form.register("content")} data-testid="textarea-entry-content" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="button-save-entry">{editingEntry ? "Update Entry" : "Save Entry"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading entries...</div>
      ) : entries?.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start Your Journal</h3>
            <p className="text-muted-foreground mb-6">Begin documenting your thoughts and feelings.</p>
            <Button onClick={() => setIsOpen(true)} data-testid="button-first-entry">Write First Entry</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {latestEntry && (
              <Card className="shadow-lg border-2 border-primary/20" data-testid="card-latest-entry">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", moods.find(m => m.value === latestEntry.mood)?.bg || "bg-secondary")}>
                        {getMoodIcon(latestEntry.mood)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-primary uppercase tracking-wide">Latest entry</p>
                        <CardTitle className="text-lg">
                          {format(new Date(latestEntry.date), "EEEE, MMMM d, yyyy")}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">{latestEntry.mood || "No mood"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(latestEntry)} data-testid={`button-edit-entry-${latestEntry.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteEntry(latestEntry.id)} data-testid={`button-delete-entry-${latestEntry.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{latestEntry.content}</p>
                </CardContent>
              </Card>
            )}
            <div className="space-y-6">
              {entries?.slice(latestEntry ? 1 : 0).map((entry) => (
                <Card key={entry.id} className="shadow-md hover:shadow-lg transition-shadow group" data-testid={`card-entry-${entry.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", moods.find(m => m.value === entry.mood)?.bg || "bg-secondary")}>
                          {getMoodIcon(entry.mood)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{format(new Date(entry.date), "EEEE, MMMM d, yyyy")}</CardTitle>
                          <p className="text-sm text-muted-foreground capitalize">{entry.mood || "No mood"}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(entry)} data-testid={`button-edit-entry-${entry.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteEntry(entry.id)} data-testid={`button-delete-entry-${entry.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{entry.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Repository
              </CardTitle>
              <p className="text-xs text-muted-foreground">Select year, month, and day. Days with entries are highlighted.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Select value={String(repoMonth.getFullYear())} onValueChange={(v) => setRepoMonth(new Date(Number(v), repoMonth.getMonth(), 1))}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(repoMonth.getMonth())} onValueChange={(v) => setRepoMonth(new Date(repoMonth.getFullYear(), Number(v), 1))}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={String(m)}>{format(new Date(2000, m, 1), "MMMM")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setRepoMonth(subMonths(repoMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm font-medium">{format(repoMonth, "MMMM yyyy")}</span>
                <Button variant="ghost" size="icon" onClick={() => setRepoMonth(addMonths(repoMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (<div key={i}>{d}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: repoStartPadding }).map((_, i) => (<div key={`pad-${i}`} className="h-8" />))}
                {repoDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const info = entriesByDate[dateStr];
                  const hasEntry = !!info;
                  const count = info?.count ?? 0;
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={cn(
                        "h-8 w-8 rounded-md text-xs font-medium transition-colors flex flex-col items-center justify-center",
                        isSelected && "bg-primary text-primary-foreground",
                        hasEntry && !isSelected && "bg-primary/20 hover:bg-primary/30",
                        !hasEntry && !isSelected && "hover:bg-secondary"
                      )}
                      data-testid={`repo-day-${dateStr}`}
                      title={hasEntry ? `${count} entry(ies)` : ""}
                    >
                      <span>{day.getDate()}</span>
                      {hasEntry && count > 0 && <span className="text-[9px] leading-none">{count}</span>}
                    </button>
                  );
                })}
              </div>
              {selectedDate && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{format(new Date(selectedDate), "EEEE, MMM d")}</p>
                  {entriesForSelectedDate.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No entries this day.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {entriesForSelectedDate.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-xs">
                          <span className="truncate flex-1">{entry.content.length > 40 ? entry.content.slice(0, 40) + "…" : entry.content}</span>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(entry)}><Pencil className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteEntry(entry.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Shell>
  );
}
