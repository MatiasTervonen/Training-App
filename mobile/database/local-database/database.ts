import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (db)
    try {
      await db.execAsync("SELECT 1");
      return db;
    } catch {
      db = null;
    }

  db = await SQLite.openDatabaseAsync("session.db");
  return db;
}
