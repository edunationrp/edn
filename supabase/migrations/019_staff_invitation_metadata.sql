-- Métadonnées d'invitation (affectations professeur : classes / matières)

ALTER TABLE staff_invitations ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
