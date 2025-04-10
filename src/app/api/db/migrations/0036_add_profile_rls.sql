DO
$$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_namespace n
        JOIN pg_catalog.pg_proc p ON n.oid = p.pronamespace
        WHERE n.nspname = 'auth'
        AND p.proname = 'uid'
    ) THEN
        CREATE POLICY "Enable profile select for users based on user_id"
        ON "public"."profiles"
        AS PERMISSIVE
        FOR SELECT
        TO public
        USING (
          (SELECT auth.uid()) = user_id
        );
    END IF;
END;
$$