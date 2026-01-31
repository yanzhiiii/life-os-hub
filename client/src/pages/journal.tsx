import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useJournalEntries, useCreateJournalEntry, useDeleteJournalEntry } from "@/hooks/use-journal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJournalEntrySchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, Smile, Meh, Frown, Heart, Sparkles, Calendar } from "lucide-react";
import { format } from "date-fns";
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
  const { mutate: deleteEntry } = useDeleteJournalEntry();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("neutral");

  const form = useForm<z.infer<typeof journalSchema>>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      content: "",
      mood: "neutral",
    }
  });

  const onSubmit = (data: z.infer<typeof journalSchema>) => {
    createEntry({ ...data, mood: selectedMood }, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
        setSelectedMood("neutral");
      }
    });
  };

  const getMoodIcon = (mood?: string | null) => {
    const moodData = moods.find(m => m.value === mood) || moods[1];
    const Icon = moodData.icon;
    return <Icon className={cn("w-5 h-5", moodData.color)} />;
  };

  return (
    <Shell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Journal</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Reflect on your thoughts and track your mood.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/25" data-testid="button-new-entry">
              <Plus className="w-4 h-4 mr-2" /> New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Write Journal Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <input 
                  type="date" 
                  {...form.register("date")} 
                  className="bg-transparent border-none text-lg font-medium focus:outline-none"
                  data-testid="input-entry-date"
                />
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
                          selectedMood === mood.value 
                            ? cn(mood.bg, "ring-2 ring-offset-2 ring-primary") 
                            : "bg-secondary/50 hover:bg-secondary"
                        )}
                        data-testid={`button-mood-${mood.value}`}
                      >
                        <Icon className={cn("w-6 h-6", mood.color)} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <Textarea 
                placeholder="What's on your mind today?" 
                className="min-h-[200px] text-lg"
                {...form.register("content")}
                data-testid="textarea-entry-content"
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="button-save-entry">Save Entry</Button>
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
            <Button onClick={() => setIsOpen(true)} data-testid="button-first-entry">
              Write First Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {entries?.map((entry) => (
            <Card 
              key={entry.id} 
              className="shadow-md hover:shadow-lg transition-shadow group"
              data-testid={`card-entry-${entry.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      moods.find(m => m.value === entry.mood)?.bg || "bg-secondary"
                    )}>
                      {getMoodIcon(entry.mood)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {format(new Date(entry.date), "EEEE, MMMM d, yyyy")}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{entry.mood || "No mood"}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteEntry(entry.id)}
                    data-testid={`button-delete-entry-${entry.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                  {entry.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
