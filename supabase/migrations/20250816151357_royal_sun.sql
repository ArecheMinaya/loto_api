/*
  # Create auditoria table for audit logging

  1. New Tables
    - `auditoria`
      - `id` (uuid, primary key)
      - `usuario_id` (uuid, references usuarios)
      - `entidad` (text, table/entity name)
      - `entidad_id` (uuid, record id)
      - `accion` (text, action performed)
      - `detalles` (jsonb, additional details)
      - `ip` (inet, client IP)
      - `user_agent` (text, client user agent)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `auditoria` table
    - Only admins and supervisors can read audit logs
  
  3. Indexes
    - Index on usuario_id for user activity reports
    - Index on entidad for entity-specific audits
    - Index on created_at for time-based queries
    - Composite index on (entidad, entidad_id) for record history
*/

-- Create auditoria table
CREATE TABLE IF NOT EXISTS auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  entidad text NOT NULL,
  entidad_id uuid,
  accion text NOT NULL,
  detalles jsonb DEFAULT '{}',
  ip inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad_id ON auditoria(entidad, entidad_id);

-- Enable RLS
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can read all audit logs"
  ON auditoria
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Supervisors can read audit logs"
  ON auditoria
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol IN ('supervisor', 'admin')
    )
  );