import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useDayStatuses, useUpsertDayStatus } from "@/hooks/use-day-statuses";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, Clock, Briefcase, Coffee, Stethoscope, Palmtree, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, addMonths, subMonths, differenceInDays, isFuture, isToday } from "date-fns";
import { cn } from "@/lib/utils";

const eventSchema = insertEventSchema.extend({
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
});

const dayStatusOptions = [
  { value: "working", label: "Working Day", icon: Briefcase, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  { value: "rest", label: "Rest Day", icon: Coffee, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  { value: "standby", label: "Standby", icon: Clock, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" },
  { value: "sick_leave", label: "Sick Leave", icon: Stethoscope, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
  { value: "annual_leave", label: "Annual Leave", icon: Palmtree, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  { value: "custom", label: "Custom", icon: Tag, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
];

export default function CalendarPage() {
  const { data: events } = useEvents();
  const { data: dayStatuses } = useDayStatuses();
  const { mutate: createEvent } = useCreateEvent();
  const { mutate: deleteEvent } = useDeleteEvent();
  const { mutate: upsertDayStatus } = useUpsertDayStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customLabel, setCustomLabel] = useState("");

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

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayStatus = dayStatuses?.find(s => s.date === selectedDateKey);

  const handleStatusChange = (status: string) => {
    if (status === "custom" && !customLabel) {
      return;
    }
    upsertDayStatus({
      date: selectedDateKey,
      status,
      customLabel: status === "custom" ? customLabel : undefined,
    });
    if (status !== "custom") {
      setCustomLabel("");
    }
  };

  const eventsOnSelectedDate = events?.filter(e => 
    isSameDay(new Date(e.startTime), selectedDate)
  ) || [];

  const daysWithEvents = events?.reduce((acc, e) => {
    const dateKey = format(new Date(e.startTime), "yyyy-MM-dd");
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const dayStatusMap = dayStatuses?.reduce((acc, s) => {
    acc[s.date] = s;
    return acc;
  }, {} as Record<string, typeof dayStatuses[0]>) || {};

  const getStatusColor = (status: string) => {
    return dayStatusOptions.find(o => o.value === status)?.color || "";
  };

  const upcomingEvents = events?.filter(e => {
    const eventDate = new Date(e.startTime);
    return isFuture(eventDate) || isToday(eventDate);
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 5) || [];

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Calendar</h1>
          <p className="text-muted-foreground">Plan your activities and track your days.</p>
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
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} data-testid="button-prev-month">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h3>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} data-testid="button-next-month">
                  <ChevronRight className="w-5 h-5" />
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
                  hasEvents: (date) => !!daysWithEvents[format(date, "yyyy-MM-dd")],
                  working: (date) => dayStatusMap[format(date, "yyyy-MM-dd")]?.status === "working",
                  rest: (date) => dayStatusMap[format(date, "yyyy-MM-dd")]?.status === "rest",
                  standby: (date) => dayStatusMap[format(date, "yyyy-MM-dd")]?.status === "standby",
                  sick: (date) => dayStatusMap[format(date, "yyyy-MM-dd")]?.status === "sick_leave",
                  annual: (date) => dayStatusMap[format(date, "yyyy-MM-dd")]?.status === "annual_leave",
                }}
                modifiersStyles={{
                  hasEvents: { fontWeight: "bold", textDecoration: "underline" },
                  working: { backgroundColor: "rgb(219 234 254)", borderRadius: "4px" },
                  rest: { backgroundColor: "rgb(220 252 231)", borderRadius: "4px" },
                  standby: { backgroundColor: "rgb(255 237 213)", borderRadius: "4px" },
                  sick: { backgroundColor: "rgb(254 226 226)", borderRadius: "4px" },
                  annual: { backgroundColor: "rgb(254 243 199)", borderRadius: "4px" },
                }}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.startTime);
                    const daysToGo = differenceInDays(eventDate, new Date());
                    const daysLabel = daysToGo === 0 ? "Today" : daysToGo === 1 ? "Tomorrow" : `${daysToGo} days to go`;
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30" data-testid={`upcoming-event-${event.id}`}>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{format(eventDate, "EEE, MMM d 'at' h:mm a")}</p>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          daysToGo === 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          daysToGo <= 3 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                          {daysLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {format(selectedDate, "EEEE, MMM d")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3">Day Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {dayStatusOptions.filter(o => o.value !== "custom").map((option) => {
                    const Icon = option.icon;
                    const isActive = selectedDayStatus?.status === option.value;
                    return (
                      <Button
                        key={option.value}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={cn("justify-start", isActive && option.color)}
                        onClick={() => handleStatusChange(option.value)}
                        data-testid={`button-status-${option.value}`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Custom label..."
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="flex-1"
                    data-testid="input-custom-status"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange("custom")}
                    disabled={!customLabel}
                    data-testid="button-status-custom"
                  >
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {selectedDayStatus?.status === "custom" && selectedDayStatus.customLabel && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Current: {selectedDayStatus.customLabel}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Events</p>
                {eventsOnSelectedDate.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No events scheduled</p>
                    <Button 
                      variant="ghost" 
                      className="text-primary"
                      onClick={() => {
                        form.setValue("startTime", selectedDate);
                        setIsOpen(true);
                      }}
                    >
                      Add one now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventsOnSelectedDate.map((event) => (
                      <div 
                        key={event.id} 
                        className="group p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        data-testid={`card-event-${event.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(event.startTime), "h:mm a")}
                              {event.endTime && ` - ${format(new Date(event.endTime), "h:mm a")}`}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteEvent(event.id)}
                            data-testid={`button-delete-event-${event.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
