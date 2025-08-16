/*
  # Create vendedores table

  1. New Tables
    - `vendedores`
      - `id` (uuid, primary key)
      - `nombre` (text, not null)
      - `cedula` (text, unique, not null)
      - `telefono` (text, not null)
      - `estado` (enum: activo, inactivo)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `vendedores` table
    - Add policies for different user roles
  
  3. Indexes
    - Index on cedula for quick lookups
    - Index on estado for filtering
*/

-- Create estado enum for vendedores
CREATE TYPE vendedor_estado AS ENUM ('activo', 'inactivo');

-- Create vendedores table
CREATE TABLE IF NOT EXISTS vendedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cedula text UNIQUE NOT NULL,
  telefono text NOT NULL,
  estado vendedor_estado NOT NULL DEFAULT 'activo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendedores_cedula ON vendedores(cedula);
CREATE INDEX IF NOT EXISTS idx_vendedores_estado ON vendedores(estado);
CREATE INDEX IF NOT EXISTS idx_vendedores_created_at ON vendedores(created_at DESC);

-- Enable RLS
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can do everything with vendedores"
  ON vendedores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Supervisors can read and manage vendedores"
  ON vendedores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Operadores can read active vendedores"
  ON vendedores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'operador'
    )
    AND estado = 'activo'
  );