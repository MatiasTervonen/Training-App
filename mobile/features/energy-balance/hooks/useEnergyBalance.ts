import { useQuery } from "@tanstack/react-query";
import { getEnergyBalance } from "@/database/energy-balance/get-energy-balance";

export function useEnergyBalance(date: string) {
  return useQuery({
    queryKey: ["energyBalance", date],
    queryFn: () => getEnergyBalance(date),
    enabled: !!date,
    staleTime: 60_000,
  });
}
