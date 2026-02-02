import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTransaction, type InsertDebt, type InsertSavingsGoal } from "@shared/schema";

export function useTransactions(filters?: { debtId?: number; savingsGoalId?: number }) {
  const queryKey = [api.transactions.list.path, filters?.debtId, filters?.savingsGoalId];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.debtId != null) params.set("debtId", String(filters.debtId));
      if (filters?.savingsGoalId != null) params.set("savingsGoalId", String(filters.savingsGoalId));
      const url = params.toString() ? `${api.transactions.list.path}?${params}` : api.transactions.list.path;
      const res = await fetch(url, { credentials: "include" });
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

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertTransaction>) => {
      const url = buildUrl(api.transactions.update.path, { id });
      const res = await fetch(url, {
        method: api.transactions.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update transaction");
      return api.transactions.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.transactions.delete.path, { id });
      const res = await fetch(url, { method: api.transactions.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete transaction");
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
      const res = await fetch(buildUrl(api.debts.delete.path, { id }), {
        method: api.debts.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete debt");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.debts.list.path] }),
  });
}

export function usePayDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ debtId, amount }: { debtId: number; amount: number }) => {
      const url = buildUrl(api.debts.pay.path, { id: debtId });
      const res = await fetch(url, {
        method: api.debts.pay.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to pay debt");
      return api.debts.pay.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
    },
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
      const res = await fetch(buildUrl(api.savings.delete.path, { id }), {
        method: api.savings.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete savings goal");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.savings.list.path] }),
  });
}

export function useDepositSavings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ savingsGoalId, amount }: { savingsGoalId: number; amount: number }) => {
      const url = buildUrl(api.savings.deposit.path, { id: savingsGoalId });
      const res = await fetch(url, {
        method: api.savings.deposit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add to savings");
      return api.savings.deposit.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
    },
  });
}
