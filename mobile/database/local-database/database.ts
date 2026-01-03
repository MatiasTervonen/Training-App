import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (db) return db;

  db = await SQLite.openDatabaseAsync("session.db");
  
  return db;
}
