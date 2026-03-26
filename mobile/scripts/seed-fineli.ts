/**
 * Seed Fineli foods into the Supabase `foods` and `food_nutrients` tables.
 *
 * Usage:
 *   npx tsx scripts/seed-fineli.ts              # all foods
 *   npx tsx scripts/seed-fineli.ts --limit 5    # first 5 foods (for testing)
 *   npx tsx scripts/seed-fineli.ts --dry-run    # parse only, no DB writes
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FINELI_DIR = path.join(__dirname, "..", "Fineli_Rel20");

const isDryRun = process.argv.includes("--dry-run");

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!isDryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL || "http://localhost", SUPABASE_SERVICE_KEY || "dummy");

// Nutrient codes that map to the `foods` table columns
const MACRO_MAP: Record<string, string> = {
  ENERC: "calories_per_100g", // kJ → kcal (÷ 4.184)
  PROT: "protein_per_100g",
  FAT: "fat_per_100g",
  CHOAVL: "carbs_per_100g",
  FIBC: "fiber_per_100g",
  SUGAR: "sugar_per_100g",
  FASAT: "saturated_fat_per_100g",
  NA: "sodium_per_100g", // mg → g (÷ 1000)
};

// All other nutrient codes go into `food_nutrients`
const MACRO_CODES = new Set(Object.keys(MACRO_MAP));

// ---------------------------------------------------------------------------
// CSV parsing helpers
// ---------------------------------------------------------------------------

function parseCsv(filename: string): string[][] {
  const filepath = path.join(FINELI_DIR, filename);
  const content = fs.readFileSync(filepath, "latin1"); // Fineli uses ISO-8859-1
  return content
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.trim().split(";"));
}

function parseDecimal(value: string): number {
  // Fineli uses comma as decimal separator
  const num = parseFloat(value.replace(",", "."));
  return isNaN(num) ? 0 : num;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/([,;]\s*)/)
    .map((part) => {
      if (/^[,;]\s*$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function loadFoodNames(lang: "FI" | "EN"): Map<number, string> {
  const rows = parseCsv(`foodname_${lang}.csv`);
  const map = new Map<number, string>();
  // Skip header: FOODID;FOODNAME;LANG
  for (let i = 1; i < rows.length; i++) {
    const [idStr, name] = rows[i];
    if (idStr && name) {
      map.set(parseInt(idStr, 10), name);
    }
  }
  return map;
}

type ComponentDef = { code: string; unit: string };

function loadComponents(): Map<string, ComponentDef> {
  const rows = parseCsv("component.csv");
  const map = new Map<string, ComponentDef>();
  // Skip header: EUFDNAME;COMPUNIT;CMPCLASS;CMPCLASSP
  for (let i = 1; i < rows.length; i++) {
    const [code, unit] = rows[i];
    if (code && unit) {
      map.set(code, { code, unit });
    }
  }
  return map;
}

type NutrientValue = { code: string; value: number };

function loadComponentValues(): Map<number, NutrientValue[]> {
  const rows = parseCsv("component_value.csv");
  const map = new Map<number, NutrientValue[]>();
  // Skip header: FOODID;EUFDNAME;BESTLOC;ACQTYPE;METHTYPE;METHIND
  for (let i = 1; i < rows.length; i++) {
    const [idStr, code, valueStr] = rows[i];
    if (!idStr || !code || !valueStr) continue;
    const foodId = parseInt(idStr, 10);
    const value = parseDecimal(valueStr);
    if (!map.has(foodId)) map.set(foodId, []);
    map.get(foodId)!.push({ code, value });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;
  const dryRun = isDryRun;

  console.log(`Loading Fineli data from ${FINELI_DIR}...`);

  const namesFi = loadFoodNames("FI");
  const namesEn = loadFoodNames("EN");
  const components = loadComponents();
  const componentValues = loadComponentValues();

  console.log(`Loaded ${namesFi.size} Finnish names, ${namesEn.size} English names`);
  console.log(`Loaded ${componentValues.size} foods with nutrient data`);

  // Build food list from Finnish names (primary)
  const foodIds = [...namesFi.keys()].slice(0, limit);
  console.log(`Processing ${foodIds.length} foods...`);

  // Clean up existing Fineli foods before inserting (food_nutrients cascade-deletes)
  if (!dryRun) {
    const { error: deleteError } = await supabase
      .from("foods")
      .delete()
      .eq("source", "fineli");

    if (deleteError) {
      console.error("Error deleting existing Fineli foods:", deleteError.message);
      process.exit(1);
    }
    console.log("Cleared existing Fineli foods");
  }

  let insertedFoods = 0;
  let insertedNutrients = 0;
  const BATCH_SIZE = 100;

  for (let batchStart = 0; batchStart < foodIds.length; batchStart += BATCH_SIZE) {
    const batchIds = foodIds.slice(batchStart, batchStart + BATCH_SIZE);

    const foodRows = batchIds.map((foodId) => {
      const nameFi = toTitleCase(namesFi.get(foodId) ?? "Unknown");
      const nameEn = namesEn.get(foodId) ? toTitleCase(namesEn.get(foodId)!) : null;
      const nutrients = componentValues.get(foodId) ?? [];

      const macros: Record<string, number | null> = {
        calories_per_100g: null,
        protein_per_100g: null,
        fat_per_100g: null,
        carbs_per_100g: null,
        fiber_per_100g: null,
        sugar_per_100g: null,
        saturated_fat_per_100g: null,
        sodium_per_100g: null,
      };

      for (const n of nutrients) {
        if (MACRO_CODES.has(n.code)) {
          const col = MACRO_MAP[n.code];
          let value = n.value;
          // Convert kJ → kcal
          if (n.code === "ENERC") value = Math.round((value / 4.184) * 100) / 100;
          // Convert sodium mg → g
          if (n.code === "NA") value = Math.round((value / 1000) * 1000) / 1000;
          macros[col] = value;
        }
      }

      return {
        fineli_id: foodId,
        name: nameFi,
        name_en: nameEn,
        ...macros,
        source: "fineli",
        serving_size_g: 100,
      };
    });

    if (dryRun) {
      for (const row of foodRows) {
        console.log(`  [DRY RUN] ${row.fineli_id}: ${row.name} / ${row.name_en} — ${row.calories_per_100g} kcal`);
      }
      insertedFoods += foodRows.length;
      continue;
    }

    const foodInserts = foodRows.map((row) => ({
      name: row.name,
      name_en: row.name_en,
      calories_per_100g: row.calories_per_100g,
      protein_per_100g: row.protein_per_100g,
      carbs_per_100g: row.carbs_per_100g,
      fat_per_100g: row.fat_per_100g,
      fiber_per_100g: row.fiber_per_100g,
      sugar_per_100g: row.sugar_per_100g,
      sodium_per_100g: row.sodium_per_100g,
      saturated_fat_per_100g: row.saturated_fat_per_100g,
      source: "fineli",
      serving_size_g: 100,
    }));

    const { data: insertedData, error: foodError } = await supabase
      .from("foods")
      .insert(foodInserts)
      .select("id");

    if (foodError) {
      console.error(`Error inserting foods batch at ${batchStart}:`, foodError.message);
      continue;
    }

    insertedFoods += insertedData.length;

    // Build nutrient rows for food_nutrients table
    const nutrientRows: { food_id: string; nutrient_code: string; value: number; unit: string }[] = [];

    for (let i = 0; i < insertedData.length; i++) {
      const fineliId = batchIds[i];
      const nutrients = componentValues.get(fineliId) ?? [];

      for (const n of nutrients) {
        if (MACRO_CODES.has(n.code)) continue; // already in foods table
        const comp = components.get(n.code);
        if (!comp || n.value === 0) continue; // skip zero values to save space

        nutrientRows.push({
          food_id: insertedData[i].id,
          nutrient_code: n.code,
          value: n.value,
          unit: comp.unit,
        });
      }
    }

    if (nutrientRows.length > 0) {
      const { error: nutrientError } = await supabase
        .from("food_nutrients")
        .upsert(nutrientRows, { onConflict: "food_id,nutrient_code" });

      if (nutrientError) {
        console.error(`Error inserting nutrients batch at ${batchStart}:`, nutrientError.message);
      } else {
        insertedNutrients += nutrientRows.length;
      }
    }

    console.log(`  Batch ${batchStart / BATCH_SIZE + 1}: ${insertedData.length} foods, ${nutrientRows.length} nutrient values`);
  }

  console.log(`\nDone! ${insertedFoods} foods, ${insertedNutrients} nutrient values`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
