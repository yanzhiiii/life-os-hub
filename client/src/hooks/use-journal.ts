import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertJournalEntry } from "@shared/schema";

export function useJournalEntries() {
  return useQuery({
    queryKey: [api.journal.list.path],
    queryFn: async () => {
      const res = await fetch(api.journal.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch journal entries");
      return api.journal.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertJournalEntry) => {
      const res = await fetch(api.journal.create.path, {
        method: api.journal.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create journal entry");
      return api.journal.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.journal.list.path] }),
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertJournalEntry>) => {
      const url = buildUrl(api.journal.update.path, { id });
      const res = await fetch(url, {
        method: api.journal.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update journal entry");
      return api.journal.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.journal.list.path] }),
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.journal.delete.path, { id });
      const res = await fetch(url, {
        method: api.journal.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete journal entry");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.journal.list.path] }),
  });
}
