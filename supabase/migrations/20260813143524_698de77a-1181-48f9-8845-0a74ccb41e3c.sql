CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_normalized text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'ANALYST' CHECK (role IN ('SUPER_ADMIN','STORE_MANAGER','SALES_STAFF','INVENTORY_MANAGER','PRESCRIPTION_STAFF','ANALYST')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','LOCKED','DISABLED')),
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_secret text,
  mfa_backup_codes text[] NOT NULL DEFAULT '{}',
  mfa_required boolean NOT NULL DEFAULT false,
  must_change_password boolean NOT NULL DEFAULT false,
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  csrf_token_hash text NOT NULL,
  mfa_verified boolean NOT NULL DEFAULT false,
  ip text,
  user_agent text,
  device_label text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_sessions_user_idx ON public.admin_sessions(admin_user_id);

CREATE TABLE public.admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized text,
  ip text,
  success boolean NOT NULL DEFAULT false,
  reason text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_login_attempts_email_idx ON public.admin_login_attempts(email_normalized, created_at DESC);
CREATE INDEX admin_login_attempts_ip_idx ON public.admin_login_attempts(ip, created_at DESC);

CREATE TABLE public.admin_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  actor_email text,
  event text NOT NULL,
  result text NOT NULL DEFAULT 'success',
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  ip text,
  user_agent text,
  resource text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_security_events_created_idx ON public.admin_security_events(created_at DESC);

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  module text NOT NULL,
  entity_type text,
  entity_id text,
  entity_label text,
  previous_value jsonb,
  new_value jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log(created_at DESC);

CREATE TABLE public.admin_password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_users TO service_role;
GRANT ALL ON public.admin_sessions TO service_role;
GRANT ALL ON public.admin_login_attempts TO service_role;
GRANT ALL ON public.admin_security_events TO service_role;
GRANT ALL ON public.admin_audit_log TO service_role;
GRANT ALL ON public.admin_password_resets TO service_role;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users no client access" ON public.admin_users FOR SELECT TO authenticated USING (false);
CREATE POLICY "admin_sessions no client access" ON public.admin_sessions FOR SELECT TO authenticated USING (false);
CREATE POLICY "admin_login_attempts no client access" ON public.admin_login_attempts FOR SELECT TO authenticated USING (false);
CREATE POLICY "admin_security_events no client access" ON public.admin_security_events FOR SELECT TO authenticated USING (false);
CREATE POLICY "admin_audit_log no client access" ON public.admin_audit_log FOR SELECT TO authenticated USING (false);
CREATE POLICY "admin_password_resets no client access" ON public.admin_password_resets FOR SELECT TO authenticated USING (false);

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admin_sessions_updated_at BEFORE UPDATE ON public.admin_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();