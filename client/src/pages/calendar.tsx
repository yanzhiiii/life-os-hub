import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useDayStatuses, useUpsertDayStatus, useDeleteDayStatus } from "@/hooks/use-day-statuses";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, Clock, Briefcase, Coffee, Stethoscope, Palmtree, Tag, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, isSameDay, addMonths, subMonths, differenceInDays, isFuture, isToday, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
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
  const { mutate: deleteDayStatus } = useDeleteDayStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customLabel, setCustomLabel] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  
  // Paint mode for day status - select a status, then click days to apply
  const [paintMode, setPaintMode] = useState<string | null>(null);

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

  const handleStatusChange = (status: string, targetDate?: string) => {
    const dateToUpdate = targetDate || selectedDateKey;
    if (status === "custom" && !customLabel) {
      return;
    }
    upsertDayStatus({
      date: dateToUpdate,
      status,
      customLabel: status === "custom" ? customLabel : undefined,
    });
    if (status !== "custom") {
      setCustomLabel("");
    }
  };
  
  // Handle clicking a day - always select, and apply paint mode if active
  const handleDayClick = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    
    // Always select the day so details panel updates
    setSelectedDate(day);
    
    if (paintMode) {
      // Also apply the selected status to this day
      handleStatusChange(paintMode, dateStr);
    }
  };
  
  // Open event dialog with specific date
  const openEventDialogForDate = (day: Date) => {
    setSelectedDate(day);
    const defaultDateTime = format(day, "yyyy-MM-dd") + "T09:00";
    setEventStartTime(defaultDateTime);
    form.reset({ title: "", category: "general", notes: "" });
    setIsOpen(true);
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

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startPadding = getDay(startOfMonth(currentMonth));
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDay = (day: Date) => {
    return events?.filter(e => isSameDay(new Date(e.startTime), day)) || [];
  };

  const getStatusInfo = (status: string | undefined) => {
    if (!status) return null;
    return dayStatusOptions.find(o => o.value === status);
  };

  return (
    <Shell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Calendar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Plan your activities and track your days.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            const defaultDateTime = format(selectedDate, "yyyy-MM-dd") + "T09:00";
            setEventStartTime(defaultDateTime);
            form.reset({ title: "", category: "general", notes: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/25" data-testid="button-add-event">
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event for {format(selectedDate, "MMMM d, yyyy")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = form.getValues();
              if (!formData.title) return;
              createEvent({
                ...formData,
                startTime: new Date(eventStartTime),
              }, {
                onSuccess: () => {
                  setIsOpen(false);
                  form.reset();
                  setEventStartTime("");
                }
              });
            }} className="space-y-4 mt-4">
              <Input placeholder="Event title" {...form.register("title")} data-testid="input-event-title" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Start Time</label>
                  <Input 
                    type="datetime-local" 
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    data-testid="input-event-start" 
                  />
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

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left: Calendar Grid */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-lg">
            <CardContent className="p-3 sm:p-4">
              {/* Month Navigation */}
              <div className="flex justify-between items-center mb-3">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} data-testid="button-prev-month">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-lg sm:text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h3>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} data-testid="button-next-month">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Paint Mode Toolbar - Compact */}
              <div className="mb-3 p-2 sm:p-3 rounded-lg bg-secondary/30 border">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">
                    {paintMode ? "Painting:" : "Paint:"}
                  </span>
                  {dayStatusOptions.filter(o => o.value !== "custom").map((option) => {
                    const Icon = option.icon;
                    const isActive = paintMode === option.value;
                    return (
                      <Button
                        key={option.value}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-7 w-7 p-0 sm:h-8 sm:w-auto sm:px-2 sm:gap-1.5",
                          isActive && option.color
                        )}
                        onClick={() => setPaintMode(isActive ? null : option.value)}
                        title={option.label}
                        data-testid={`paint-status-${option.value}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-xs">{option.label}</span>
                      </Button>
                    );
                  })}
                  {paintMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 px-2 text-xs"
                      onClick={() => setPaintMode(null)}
                      data-testid="paint-mode-cancel"
                    >
                      Done
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                {WEEKDAYS.map((day, i) => (
                  <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-14 sm:h-20 lg:h-28" />
                ))}
                {calendarDays.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayEvents = getEventsForDay(day);
                  const dayStatus = dayStatusMap[dateStr];
                  const statusInfo = getStatusInfo(dayStatus?.status);
                  const StatusIcon = statusInfo?.icon;
                  const isTodayDate = isToday(day);
                  const isSelected = isSameDay(day, selectedDate);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      onDoubleClick={() => openEventDialogForDate(day)}
                      className={cn(
                        "group h-14 sm:h-20 lg:h-28 p-1 sm:p-1.5 rounded-md sm:rounded-lg text-xs transition-all relative flex flex-col items-start border",
                        isTodayDate && "ring-2 ring-primary ring-offset-1",
                        isSelected && "bg-primary/10 border-primary",
                        statusInfo && !isSelected && statusInfo.color,
                        !isSelected && !statusInfo && "border-transparent hover:border-primary/30 hover:bg-secondary/30",
                        paintMode && "cursor-crosshair"
                      )}
                      data-testid={`calendar-day-${dateStr}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          "font-semibold text-xs sm:text-sm",
                          isTodayDate && "text-primary"
                        )}>{format(day, "d")}</span>
                        <div className="flex items-center gap-0.5">
                          {StatusIcon && (
                            <StatusIcon className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3", statusInfo.color.split(' ')[0])} />
                          )}
                          {!paintMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEventDialogForDate(day);
                              }}
                              className={cn(
                                "w-4 h-4 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center sm:w-5 sm:h-5 transition-opacity",
                                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}
                              data-testid={`add-event-${dateStr}`}
                            >
                              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="hidden sm:block">
                        {dayStatus?.status === "custom" && dayStatus.customLabel && (
                          <div className="text-[9px] text-purple-600 font-medium truncate w-full mb-0.5">
                            {dayStatus.customLabel}
                          </div>
                        )}
                      </div>
                      
                      <div className="hidden sm:flex flex-col gap-0.5 w-full flex-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map(event => {
                          const categoryColors: Record<string, string> = {
                            work: "bg-blue-500",
                            personal: "bg-green-500",
                            health: "bg-red-500",
                            social: "bg-purple-500",
                            general: "bg-gray-500",
                          };
                          return (
                            <div 
                              key={event.id} 
                              className="flex items-center gap-1 px-1 py-0.5 rounded bg-secondary/70 truncate"
                              title={`${event.title} - ${format(new Date(event.startTime), "h:mm a")}`}
                            >
                              <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", categoryColors[event.category || 'general'])} />
                              <span className="truncate text-[9px] lg:text-[10px]">{event.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="sm:hidden absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Compact Legend */}
              <div className="mt-3 pt-2 border-t flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[10px] text-muted-foreground">Legend:</span>
                {dayStatusOptions.filter(o => o.value !== "custom").map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={option.value} className="flex items-center gap-1 text-[10px]">
                      <Icon className={cn("w-3 h-3", option.color.split(' ')[0])} />
                      <span className="text-muted-foreground hidden sm:inline">{option.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-3 text-sm">No upcoming events</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.startTime);
                    const daysToGo = differenceInDays(eventDate, new Date());
                    const daysLabel = daysToGo === 0 ? "Today" : daysToGo === 1 ? "Tomorrow" : `${daysToGo}d`;
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 gap-2" data-testid={`upcoming-event-${event.id}`}>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{format(eventDate, "EEE, MMM d • h:mm a")}</p>
                        </div>
                        <Badge variant="secondary" className={cn(
                          "text-[10px] shrink-0",
                          daysToGo === 0 && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          daysToGo === 1 && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                          daysToGo > 1 && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                          {daysLabel}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Selected Day Details */}
        <div className="space-y-4">
          <Card className="shadow-lg sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {format(selectedDate, "EEE, MMM d")}
              </CardTitle>
              <CardDescription>
                {isToday(selectedDate) ? "Today" : isFuture(selectedDate) ? `${differenceInDays(selectedDate, new Date())} days from now` : `${differenceInDays(new Date(), selectedDate)} days ago`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Day Status</p>
                  <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-set-status">
                        {selectedDayStatus ? "Change" : "Set Status"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Set Day Status for {format(selectedDate, "MMMM d, yyyy")}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-2">
                          {dayStatusOptions.filter(o => o.value !== "custom").map((option) => {
                            const Icon = option.icon;
                            const isActive = selectedDayStatus?.status === option.value;
                            return (
                              <Button
                                key={option.value}
                                variant={isActive ? "default" : "outline"}
                                className={cn("justify-start", isActive && option.color)}
                                onClick={() => {
                                  handleStatusChange(option.value);
                                  setIsStatusOpen(false);
                                }}
                                data-testid={`button-status-${option.value}`}
                              >
                                <Icon className="w-4 h-4 mr-2" />
                                {option.label}
                              </Button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Custom label..."
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                            className="flex-1"
                            data-testid="input-custom-status"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              handleStatusChange("custom");
                              setIsStatusOpen(false);
                            }}
                            disabled={!customLabel}
                            data-testid="button-status-custom"
                          >
                            <Tag className="w-4 h-4" />
                          </Button>
                        </div>
                        {selectedDayStatus && (
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => {
                              deleteDayStatus(format(selectedDate, "yyyy-MM-dd"));
                              setIsStatusOpen(false);
                            }}
                            data-testid="button-clear-status"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Status
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {selectedDayStatus ? (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-md",
                    dayStatusOptions.find(o => o.value === selectedDayStatus.status)?.color || "bg-muted"
                  )}>
                    {(() => {
                      const option = dayStatusOptions.find(o => o.value === selectedDayStatus.status);
                      const Icon = option?.icon || Tag;
                      return <Icon className="w-5 h-5" />;
                    })()}
                    <span className="font-medium">
                      {selectedDayStatus.status === "custom" && selectedDayStatus.customLabel
                        ? selectedDayStatus.customLabel
                        : dayStatusOptions.find(o => o.value === selectedDayStatus.status)?.label || "Unknown"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No status set for this day</p>
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
