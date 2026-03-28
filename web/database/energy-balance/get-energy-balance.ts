import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import type { EnergyBalance } from "@/types/energy-balance";

export async function getEnergyBalance(date: string): Promise<EnergyBalance> {
  const supabase = createClient();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { data, error } = await supabase.rpc("energy_balance_get_daily", {
    p_date: date,
    p_tz: tz,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching energy balance",
      route: "/database/energy-balance/get-energy-balance",
      method: "GET",
    });
    throw new Error("Error fetching energy balance");
  }

  return data as EnergyBalance;
}
