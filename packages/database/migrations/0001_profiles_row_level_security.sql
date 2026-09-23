CREATE SCHEMA IF NOT EXISTS app;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = app, pg_temp
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = app, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at();
--> statement-breakpoint
CREATE ROLE apex_app NOLOGIN;
--> statement-breakpoint
GRANT apex_app TO CURRENT_USER;
--> statement-breakpoint
REVOKE ALL ON TABLE profiles FROM PUBLIC;
--> statement-breakpoint
GRANT USAGE ON SCHEMA app TO apex_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app.current_user_id() TO apex_app;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO apex_app;
--> statement-breakpoint
GRANT SELECT, UPDATE ON TABLE profiles TO apex_app;
--> statement-breakpoint
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY profiles_select ON profiles
FOR SELECT
TO apex_app
USING (
  id = app.current_user_id()
  OR EXISTS (
    SELECT 1
    FROM profiles AS actor
    WHERE actor.id = app.current_user_id()
      AND actor.role IN ('admin', 'manager', 'support', 'analyst')
  )
);
--> statement-breakpoint
CREATE POLICY profiles_update_own_display_name ON profiles
FOR UPDATE
TO apex_app
USING (id = app.current_user_id())
WITH CHECK (
  id = app.current_user_id()
  AND role = (
    SELECT actor.role
    FROM profiles AS actor
    WHERE actor.id = app.current_user_id()
  )
);
--> statement-breakpoint
CREATE POLICY profiles_update_role ON profiles
FOR UPDATE
TO apex_app
USING (
  id <> app.current_user_id()
  AND EXISTS (
    SELECT 1
    FROM profiles AS actor
    WHERE actor.id = app.current_user_id()
      AND actor.role = 'admin'
  )
)
WITH CHECK (
  id <> app.current_user_id()
  AND display_name = (
    SELECT target.display_name
    FROM profiles AS target
    WHERE target.id = profiles.id
  )
  AND EXISTS (
    SELECT 1
    FROM profiles AS actor
    WHERE actor.id = app.current_user_id()
      AND actor.role = 'admin'
  )
);
