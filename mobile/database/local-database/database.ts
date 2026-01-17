import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  
  if (db) {
    try {
      await db.execAsync("SELECT 1");
      return db;
    } catch (e) {
      db = null;
    }
  }

  try {
    db = await SQLite.openDatabaseAsync("session.db");
    return db;
  } catch (e) {
    console.error("[DB] FAILED to open database:", e);
    throw e;
  }
}
