import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DayStatus } from "@shared/schema";

export function useDayStatuses() {
  return useQuery<DayStatus[]>({
    queryKey: ["/api/day-statuses"],
  });
}

export function useDayStatusByDate(date: string) {
  return useQuery<DayStatus | null>({
    queryKey: ["/api/day-statuses", date],
    queryFn: async () => {
      const res = await fetch(`/api/day-statuses/${date}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch day status");
      return res.json();
    },
    enabled: !!date,
  });
}

export function useUpsertDayStatus() {
  return useMutation({
    mutationFn: async ({ date, status, customLabel, color }: { 
      date: string; 
      status: string; 
      customLabel?: string;
      color?: string;
    }) => {
      return apiRequest("PUT", `/api/day-statuses/${date}`, { status, customLabel, color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/day-statuses"] });
    },
  });
}
