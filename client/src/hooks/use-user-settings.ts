import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useUpdateUserSettings() {
  return useMutation({
    mutationFn: async (settings: {
      displayName?: string;
      currency?: string;
      paydayConfig?: {
        type: "fixed" | "custom" | "monthly" | "semiMonthly";
        dates?: number[];
        nextDate?: string;
      };
    }) => {
      return apiRequest("PATCH", "/api/user/settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });
}
