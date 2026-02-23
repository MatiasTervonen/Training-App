# Migrations

Database changes are managed through Supabase migration files in `supabase/migrations/`.

## Location

```
supabase/
  migrations/
    20260216142727_remote_schema.sql        # Initial schema
    20260216143829_add_note_folders.sql      # Note folders feature
    20260216160000_move_to_folder_pins.sql   # Folder pin cleanup
    20260216170000_cleanup_functions.sql     # Fix function overloads
    20260217100000_fix_overloads.sql         # Merge duplicate signatures
```

## Commands

Supabase CLI is installed as a local npm dependency. Use `npx` to run it:

```bash
# Create a new migration
npx supabase migration new my_migration_name

# Apply migrations to local database
npx supabase db reset

# Push migrations to remote (production)
npx supabase db push

# Pull remote schema changes into a migration
npx supabase db pull

# Repair a failed migration (mark as reverted so it can be re-pushed)
npx supabase migration repair <timestamp> --status reverted
```

## Important Rules

### Never use `CREATE OR REPLACE FUNCTION`

`CREATE OR REPLACE FUNCTION` only replaces a function if the **exact parameter signature** matches. If parameters changed, it silently creates a **duplicate overload** instead — which causes PostgREST ambiguity errors.

Always do this:

```sql
-- Drop the old signature first
DROP FUNCTION IF EXISTS my_function(old_param_type, old_param_type);

-- Then create with the new signature
CREATE FUNCTION my_function(new_param_type, new_param_type)
RETURNS void AS $$
BEGIN
  -- ...
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

### Use `SECURITY INVOKER` for RPC functions

RPC functions use `SECURITY INVOKER` so they run as the calling user and **RLS policies still apply**. This means you don't need to worry about functions bypassing row-level security — each user can only access their own data, even through RPC calls.

Only `get_jwt()` and `handle_new_user()` (auth trigger) use `SECURITY DEFINER` since those need elevated access.