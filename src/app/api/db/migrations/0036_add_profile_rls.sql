create policy "Enable profile select for users based on user_id"
on "public"."profiles"
as PERMISSIVE
for SELECT
to public
using (
  (select auth.uid()) = user_id
);