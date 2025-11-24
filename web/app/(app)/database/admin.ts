"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";
import { createAdminClient } from "@/utils/supabase/admin";

type SaveExerciserops = {
  id: string;
  name: string;
  language: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function saveExerciseToDB({
  id,
  name,
  language,
  equipment,
  muscle_group,
  main_group,
}: SaveExerciserops) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: existingExercise, error: fetchError } = await supabase
    .from("gym_exercises")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  if (fetchError) {
    handleError(fetchError, {
      message: "Error checking existing exercise",
      route: "server-action: saveExerciseToDB-Admin",
      method: "direct",
    });
    throw new Error("Error checking existing exercise");
  }

  if (existingExercise) {
    throw new Error("Exercise with this name already exists.");
  }

  const { error: exerciseError } = await supabase
    .from("gym_exercises")
    .insert([
      {
        id,
        name,
        language,
        equipment,
        muscle_group,
        main_group,
      },
    ])
    .select()
    .single();

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error adding new exercise",
      route: "server-action: saveExerciseToDB-Admin",
      method: "direct",
    });
    throw new Error("Error adding new exercise");
  }

  return { success: true };
}

// ban user

type BanUser = {
  user_id: string;
  duration: string;
  reason: string;
};

export async function banUser({ user_id, duration, reason }: BanUser) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Check if the user has admin privileges
  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }

  if (duration === "unban") {
    // Unban the user
    const { error: unbanError } = await supabase
      .from("users")
      .update({
        banned_until: null,
        ban_reason: null,
      })
      .eq("id", user_id);

    if (unbanError) {
      handleError(unbanError, {
        message: "Error unbanning user",
        route: "server-action: banUser-Admin",
        method: "direct",
      });
      throw new Error("Error unbanning user");
    }

    return { success: true };
  }

  let bannedUntil = null;
  if (duration !== "permanent") {
    const hours = parseInt(duration.replace("h", ""), 10);
    if (isNaN(hours)) {
      throw new Error("Invalid duration format");
    }
    bannedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
  } else {
    bannedUntil = new Date(Date.now() + 876600 * 60 * 60 * 1000);
  }

  const { error: dbError } = await supabase
    .from("users")
    .update({
      banned_until: bannedUntil.toISOString(),
      ban_reason: reason || null,
    })
    .eq("id", user_id);

  if (dbError) {
    handleError(dbError, {
      message: "Error banning user",
      route: "server-action: banUser-Admin",
      method: "direct",
    });
    throw new Error("Error banning user");
  }

  return { success: true };
}

export async function deleteUser(user_id: string) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Check if the user has admin privileges
  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const { error: errorUserTable } = await supabase
    .from("users")
    .delete()
    .eq("id", user_id);

  if (errorUserTable) {
    console.log("error server", errorUserTable);
    handleError(errorUserTable, {
      message: "Error deleting user from users table",
      route: "server-actions: deleteUser",
      method: "direct",
    });
    throw new Error("Error deleting user");
  }

  const { error } = await adminSupabase.auth.admin.deleteUser(user_id);

  if (error) {
    console.log("error server", error);
    handleError(error, {
      message: "Error deleting user from auth table",
      route: "server-actions: deleteUser",
      method: "direct",
    });
    throw new Error("Error deleting user");
  }

  return { success: true };
}

type PromoteUser = {
  userRole: string;
  user_id: string;
};

export async function promoteUser({ userRole, user_id }: PromoteUser) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Check if the user has admin privileges
  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const { error: adminError } = await adminSupabase.auth.admin.updateUserById(
    user_id,
    {
      app_metadata: { role: userRole },
    }
  );

  if (adminError) {
    handleError(adminError, {
      message: "Error promoting user",
      route: "server_action: promoteUser auth table",
      method: "direct",
    });
    throw new Error("Error promoting user");
  }

  const { error: dbError } = await supabase
    .from("users")
    .update({ role: userRole })
    .eq("id", user_id);

  if (dbError) {
    handleError(dbError, {
      message: "Error updating user role in database",
      route: "server_action: promoteUser users table",
      method: "direct",
    });
    throw new Error("Error updating user role in database");
  }

  return { success: true };
}

export async function getUsers({
  pageParam,
  limit,
}: {
  pageParam: number;
  limit: number;
}) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const from = pageParam * limit;
  const to = from + limit - 1;

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (usersError || !users) {
    handleError(usersError, {
      message: "Error fetching users",
      route: "server_action: getUsers",
      method: "direct",
    });
    throw new Error("Unauthorized");
  }

  return users;
}

export async function getUserCount() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: userCount, error: countError } = await supabase
    .from("analytics_counts")
    .select("count")
    .eq("id", "users")
    .single();

  if (countError || !userCount) {
    console.log("error", countError);
    handleError(countError, {
      message: "Error fetching user count",
      route: "server_action: getUserCount",
      method: "direct",
    });
    throw new Error("Error fetching user count");
  }

  return userCount;
}
