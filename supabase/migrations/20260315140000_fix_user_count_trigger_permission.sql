-- Fix: decrement_user_count trigger fails with "permission denied for table analytics_counts"
-- when deleting a user via service_role admin API.
-- Setting SECURITY DEFINER makes the function run as the owner (postgres), bypassing RLS.

CREATE OR REPLACE FUNCTION public.decrement_user_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.analytics_counts
  SET count = count - 1,
      updated_at = now()
  WHERE id = 'users';
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_user_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.analytics_counts
  SET count = count + 1,
      updated_at = now()
  WHERE id = 'users';
  RETURN NEW;
END;
$$;
