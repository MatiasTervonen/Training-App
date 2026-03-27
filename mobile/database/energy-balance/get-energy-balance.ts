import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type EnergyBalance = {
  calories_consumed: number;
  bmr: number;
  activity_level: number;
  base_burn: number;
  net_exercise_calories: number;
  gross_exercise_calories: number;
  tef: number;
  tdee: number;
  balance: number;
  weight_kg: number;
  has_profile: boolean;
};

export async function getEnergyBalance(
  date: string,
): Promise<EnergyBalance> {
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
