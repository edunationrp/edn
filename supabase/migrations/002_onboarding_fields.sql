-- EduNation - Migration 002 : onboarding (directeur, organisation, ecole)
-- Pre-requis : migration 001 deja appliquee

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profil directeur
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Burkina Faso';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'fr';

-- Organisations (groupe multi-ecoles)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  plan_code TEXT NOT NULL DEFAULT 'starter',
  max_schools INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extension etablissements
ALTER TABLE schools ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS structure_name TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS evaluation_system TEXT DEFAULT 'sur_20';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS main_language TEXT DEFAULT 'fr';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS estimated_students INTEGER;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'prive';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS academic_format TEXT DEFAULT 'trimestre';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Format annuel pour les periodes
ALTER TABLE terms DROP CONSTRAINT IF EXISTS terms_type_check;
ALTER TABLE terms ADD CONSTRAINT terms_type_check
  CHECK (type IN ('trimestre', 'semestre', 'annuel'));

-- RLS organisations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_select" ON organizations;
CREATE POLICY "organizations_select" ON organizations FOR SELECT
  USING (founder_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "organizations_insert" ON organizations;
CREATE POLICY "organizations_insert" ON organizations FOR INSERT
  WITH CHECK (founder_id = auth.uid());

DROP POLICY IF EXISTS "organizations_update" ON organizations;
CREATE POLICY "organizations_update" ON organizations FOR UPDATE
  USING (founder_id = auth.uid() OR is_super_admin());

-- Index
CREATE INDEX IF NOT EXISTS idx_organizations_founder_id ON organizations(founder_id);
CREATE INDEX IF NOT EXISTS idx_schools_organization_id ON schools(organization_id);
