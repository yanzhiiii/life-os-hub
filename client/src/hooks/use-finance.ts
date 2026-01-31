import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTransaction, type InsertDebt, type InsertSavingsGoal } from "@shared/schema";

export function useTransactions() {
  return useQuery({
    queryKey: [api.transactions.list.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.transactions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const res = await fetch(api.transactions.create.path, {
        method: api.transactions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      return api.transactions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] }),
  });
}

export function useDebts() {
  return useQuery({
    queryKey: [api.debts.list.path],
    queryFn: async () => {
      const res = await fetch(api.debts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch debts");
      return api.debts.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDebt) => {
      const res = await fetch(api.debts.create.path, {
        method: api.debts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create debt");
      return api.debts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.debts.list.path] }),
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/debts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete debt");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.debts.list.path] }),
  });
}

export function useSavingsGoals() {
  return useQuery({
    queryKey: [api.savings.list.path],
    queryFn: async () => {
      const res = await fetch(api.savings.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch savings");
      return api.savings.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSavingsGoal) => {
      const res = await fetch(api.savings.create.path, {
        method: api.savings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create savings goal");
      return api.savings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.savings.list.path] }),
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/savings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete savings goal");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.savings.list.path] }),
  });
}
