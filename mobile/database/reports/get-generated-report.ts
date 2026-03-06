import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { GeneratedReport } from "@/types/report";

export async function getGeneratedReport(reportId: string): Promise<GeneratedReport> {
  const { data, error } = await supabase
    .from("generated_reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching generated report",
      route: "/database/reports/get-generated-report",
      method: "GET",
    });
    throw new Error("Error fetching generated report");
  }

  return data as GeneratedReport;
}
