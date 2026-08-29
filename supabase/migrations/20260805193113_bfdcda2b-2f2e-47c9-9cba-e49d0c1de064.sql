REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

-- Re-grant to service_role so admin server functions can still call is_admin if needed.
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;