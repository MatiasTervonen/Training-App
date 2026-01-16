import { getDatabase } from "@/database/local-database/database";

export async function clearLocalSessionDatabase() {
  const db = await getDatabase();

  // Just drop the table - it will be recreated when starting a new session
  await db.execAsync(`DROP TABLE IF EXISTS gps_points;`);
  await db.execAsync(`DROP TABLE IF EXISTS template_route;`);
}
