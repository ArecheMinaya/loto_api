/*
  # Create bancas_vendedores junction table

  1. New Tables
    - `bancas_vendedores`
      - `id` (uuid, primary key)
      - `banca_id` (uuid, foreign key to bancas)
      - `vendedor_id` (uuid, foreign key to vendedores)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Constraints
    - Unique constraint on (banca_id, vendedor_id)
    - Foreign key constraints with cascade delete
  
  3. Security
    - Enable RLS on `bancas_vendedores` table
    - Add policies for different user roles
  
  4. Indexes
    - Index on banca_id for fast lookups
    - Index on vendedor_id for fast lookups
*/

-- Create bancas_vendedores junction table
CREATE TABLE IF NOT EXISTS bancas_vendedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banca_id uuid NOT NULL REFERENCES bancas(id) ON DELETE CASCADE,
  vendedor_id uuid NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(banca_id, vendedor_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bancas_vendedores_banca_id ON bancas_vendedores(banca_id);
CREATE INDEX IF NOT EXISTS idx_bancas_vendedores_vendedor_id ON bancas_vendedores(vendedor_id);

-- Enable RLS
ALTER TABLE bancas_vendedores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can do everything with bancas_vendedores"
  ON bancas_vendedores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Supervisors can read and manage bancas_vendedores"
  ON bancas_vendedores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Operadores can read their bancas_vendedores"
  ON bancas_vendedores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'operador'
    )
  );