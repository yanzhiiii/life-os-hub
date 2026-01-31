import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertRecurringTemplate } from "@shared/schema";

export function useRecurringTemplates() {
  return useQuery({
    queryKey: [api.recurringTemplates.list.path],
    queryFn: async () => {
      const res = await fetch(api.recurringTemplates.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recurring templates");
      return api.recurringTemplates.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRecurringTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRecurringTemplate) => {
      const res = await fetch(api.recurringTemplates.create.path, {
        method: api.recurringTemplates.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create recurring template");
      return api.recurringTemplates.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.recurringTemplates.list.path] }),
  });
}

export function useUpdateRecurringTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRecurringTemplate> }) => {
      const url = buildUrl(api.recurringTemplates.update.path, { id });
      const res = await fetch(url, {
        method: api.recurringTemplates.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update recurring template");
      return api.recurringTemplates.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.recurringTemplates.list.path] }),
  });
}

export function useDeleteRecurringTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.recurringTemplates.delete.path, { id });
      const res = await fetch(url, {
        method: api.recurringTemplates.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete recurring template");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.recurringTemplates.list.path] }),
  });
}
