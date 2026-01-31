import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, Clock, MapPin } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";

const eventSchema = insertEventSchema.extend({
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
});

export default function CalendarPage() {
  const { data: events } = useEvents();
  const { mutate: createEvent } = useCreateEvent();
  const { mutate: deleteEvent } = useDeleteEvent();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      category: "general",
      notes: "",
    }
  });

  const onSubmit = (data: z.infer<typeof eventSchema>) => {
    createEvent(data, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const eventsOnSelectedDate = events?.filter(e => 
    isSameDay(new Date(e.startTime), selectedDate)
  ) || [];

  const daysWithEvents = events?.reduce((acc, e) => {
    const dateKey = format(new Date(e.startTime), "yyyy-MM-dd");
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Calendar</h1>
          <p className="text-muted-foreground">Plan your activities and events.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/25" data-testid="button-add-event">
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <Input placeholder="Event title" {...form.register("title")} data-testid="input-event-title" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Start Time</label>
                  <Input type="datetime-local" {...form.register("startTime")} data-testid="input-event-start" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">End Time</label>
                  <Input type="datetime-local" {...form.register("endTime")} data-testid="input-event-end" />
                </div>
              </div>
              <Select onValueChange={(v) => form.setValue("category", v)} defaultValue="general">
                <SelectTrigger data-testid="select-event-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Notes (optional)" {...form.register("notes")} data-testid="input-event-notes" />
              <Button type="submit" className="w-full" data-testid="button-save-event">Save Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  {"<"}
                </Button>
                <h3 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h3>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  {">"}
                </Button>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md w-full"
                modifiers={{
                  hasEvents: (date) => !!daysWithEvents[format(date, "yyyy-MM-dd")]
                }}
                modifiersStyles={{
                  hasEvents: { fontWeight: "bold", textDecoration: "underline" }
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {format(selectedDate, "EEEE, MMM d")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsOnSelectedDate.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No events scheduled</p>
                  <Button 
                    variant="link" 
                    onClick={() => {
                      form.setValue("startTime", selectedDate);
                      setIsOpen(true);
                    }}
                  >
                    Add one now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsOnSelectedDate.map((event) => (
                    <div 
                      key={event.id} 
                      className="group p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      data-testid={`card-event-${event.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(event.startTime), "h:mm a")}
                            {event.endTime && ` - ${format(new Date(event.endTime), "h:mm a")}`}
                          </p>
                          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {event.category}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteEvent(event.id)}
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {event.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
