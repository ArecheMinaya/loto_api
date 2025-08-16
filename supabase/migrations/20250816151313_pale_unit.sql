/*
  # Create bancas table

  1. New Tables
    - `bancas`
      - `id` (uuid, primary key)
      - `nombre` (text, unique, not null)
      - `ubicacion` (text, not null)
      - `estado` (enum: activa, inactiva)
      - `ip_whitelist` (text array, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `bancas` table
    - Add policies for different user roles
  
  3. Indexes
    - Index on estado for filtering
    - Index on created_at for ordering
*/

-- Create estado enum for bancas
CREATE TYPE banca_estado AS ENUM ('activa', 'inactiva');

-- Create bancas table
CREATE TABLE IF NOT EXISTS bancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text UNIQUE NOT NULL,
  ubicacion text NOT NULL,
  estado banca_estado NOT NULL DEFAULT 'activa',
  ip_whitelist text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bancas_estado ON bancas(estado);
CREATE INDEX IF NOT EXISTS idx_bancas_created_at ON bancas(created_at DESC);

-- Enable RLS
ALTER TABLE bancas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can do everything with bancas"
  ON bancas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Supervisors can read all bancas"
  ON bancas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Operadores can read active bancas"
  ON bancas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'operador'
    )
    AND estado = 'activa'
  );