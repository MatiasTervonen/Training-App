import { handleError } from "@/utils/handleError";
import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {

  // If the database is already open, return it
  if (db) {
    try {
      await db.execAsync("SELECT 1");
      return db;
    } catch {
      // Do nothing - just return null
      db = null;
    }
  }


  // If the database is not open, open it
  try {
    db = await SQLite.openDatabaseAsync("session.db");
    return db;
  } catch (e) {
    handleError(e, {
      message: "Error opening database",
      route: "/database/local-database/database",
      method: "GET",
    });
    throw e;
  }
}

