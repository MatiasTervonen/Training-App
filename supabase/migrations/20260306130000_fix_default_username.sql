DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  random_suffix text;
  generated_name text;
  max_retries int := 10;
  attempt int := 0;
begin
  loop
    attempt := attempt + 1;
    random_suffix := lpad(floor(random() * 10000000000)::bigint::text, 10, '0');
    generated_name := 'user_' || random_suffix;

    begin
      if new.email is null then
        insert into public.users (id, email, display_name, role)
        values (new.id, null, generated_name, 'guest');
      else
        insert into public.users (id, email, display_name, role)
        values (new.id, new.email, generated_name, 'user');
      end if;

      insert into public.user_settings(user_id)
      values (new.id);

      return new;
    exception when unique_violation then
      if attempt >= max_retries then
        raise exception 'Could not generate unique username after % attempts', max_retries;
      end if;
    end;
  end loop;
end;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
