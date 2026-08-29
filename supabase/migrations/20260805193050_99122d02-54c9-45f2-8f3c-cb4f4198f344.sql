REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

-- Add an explicit restrictive policy on admins so RLS has a policy defined
-- (service_role bypasses RLS, so admin server functions still work).
CREATE POLICY "Admins table is not directly readable" ON public.admins FOR SELECT TO authenticated USING (false);