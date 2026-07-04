CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  custom_domain text UNIQUE,
  brand_color text DEFAULT '#3b82f6',
  logo_url text,
  favicon_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(agency_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.enterprise_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  sso_enabled boolean DEFAULT false,
  sso_provider text CHECK (sso_provider IN ('saml','oidc')),
  sso_config jsonb,
  audit_log_enabled boolean DEFAULT true,
  data_residency_region text DEFAULT 'us',
  fine_tuning_enabled boolean DEFAULT false,
  fine_tuning_model text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_agency_id ON public.audit_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agency_members_user_id ON public.agency_members(user_id);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can manage"
  ON public.agencies
  FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = id AND user_id = auth.uid() AND role IN ('owner','admin')
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = id AND user_id = auth.uid() AND role IN ('owner','admin')
    )
  );

CREATE POLICY "Agency members can view"
  ON public.agencies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Agency owners can manage members"
  ON public.agency_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members AS am
      WHERE am.agency_id = agency_id AND am.user_id = auth.uid() AND am.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members AS am
      WHERE am.agency_id = agency_id AND am.user_id = auth.uid() AND am.role IN ('owner','admin')
    )
  );

CREATE POLICY "Members can view own memberships"
  ON public.agency_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Agency owners can manage enterprise settings"
  ON public.enterprise_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = enterprise_settings.agency_id AND user_id = auth.uid() AND role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = enterprise_settings.agency_id AND user_id = auth.uid() AND role IN ('owner','admin')
    )
  );

CREATE POLICY "Agency members can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = audit_logs.agency_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Agency owners can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = audit_logs.agency_id AND user_id = auth.uid() AND role IN ('owner','admin')
    )
  );
