import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertRoutine, type InsertRoutineCompletion } from "@shared/schema";

export function useRoutines() {
  return useQuery({
    queryKey: [api.routines.list.path],
    queryFn: async () => {
      const res = await fetch(api.routines.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch routines");
      return api.routines.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRoutine) => {
      const res = await fetch(api.routines.create.path, {
        method: api.routines.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create routine");
      return api.routines.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.routines.list.path] }),
  });
}

export function useRoutineCompletions(date?: string) {
  return useQuery({
    queryKey: [api.routines.getCompletions.path, date],
    queryFn: async () => {
      const url = date ? `${api.routines.getCompletions.path}?date=${date}` : api.routines.getCompletions.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch completions");
      return api.routines.getCompletions.responses[200].parse(await res.json());
    },
  });
}

export function useLogRoutineCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ routineId, ...data }: { routineId: number } & Omit<InsertRoutineCompletion, 'routineId'>) => {
      const url = buildUrl(api.routines.logCompletion.path, { id: routineId });
      const res = await fetch(url, {
        method: api.routines.logCompletion.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log completion");
      return api.routines.logCompletion.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.routines.getCompletions.path] }),
  });
}
