import "dotenv/config";

import { createAdminClient } from "../utils/supabase/admin.js";

async function seed() {
  const supabase = createAdminClient();

  for (let i = 1; i <= 50; i++) {
    const email = `fakeuser${i}@example.com`;
    const password = "Password123!";
    const displayName = `FakeUser${i}`;

    // 1. Create the user in Supabase Auth
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error("Auth error:", authError);
      continue;
    }

    const userId = data.user.id;

    // 2. Insert into your public.users table
    const { error: dbError } = await supabase.from("users").insert({
      id: userId,
      email,
      display_name: displayName,
      role: "user",
      weight_unit: "kg",
      push_enabled: false,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
    } else {
      console.log(`Created test user: ${email}`);
    }
  }
}

seed();
