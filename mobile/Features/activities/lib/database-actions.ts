import { getDatabase } from "@/database/local-database/database";

export async function clearLocalSessionDatabase() {
    const db = await getDatabase();
    await db.execAsync("DELETE FROM gps_points");
    await db.execAsync("DELETE FROM session_stats");
  }