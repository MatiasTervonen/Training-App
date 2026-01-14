import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  console.log("[DB] getDatabase called, db exists:", db !== null);
  
  if (db) {
    try {
      console.log("[DB] Testing existing connection with SELECT 1...");
      await db.execAsync("SELECT 1");
      console.log("[DB] Existing connection is valid");
      return db;
    } catch (e) {
      console.log("[DB] Existing connection INVALID, will reopen:", e);
      db = null;
    }
  }

  try {
    console.log("[DB] Opening new database connection...");
    db = await SQLite.openDatabaseAsync("session.db");
    console.log("[DB] New connection opened successfully");
    return db;
  } catch (e) {
    console.error("[DB] FAILED to open database:", e);
    throw e;
  }
}
