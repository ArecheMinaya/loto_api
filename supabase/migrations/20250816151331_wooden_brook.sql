/*
  # Create sorteos table

  1. New Tables
    - `sorteos`
      - `id` (uuid, primary key)
      - `nombre` (text, not null) - e.g., "Nacional", "Leidsa", "Real"
      - `codigo` (text, unique, not null) - slug version for API
      - `horario` (time array, optional) - when draws happen
      - `activo` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `sorteos` table
    - All authenticated users can read active sorteos
    - Only admins can manage sorteos
  
  3. Indexes
    - Index on codigo for API lookups
    - Index on activo for filtering
*/

-- Create sorteos table
CREATE TABLE IF NOT EXISTS sorteos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  codigo text UNIQUE NOT NULL,
  horario time[],
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sorteos_codigo ON sorteos(codigo);
CREATE INDEX IF NOT EXISTS idx_sorteos_activo ON sorteos(activo);

-- Enable RLS
ALTER TABLE sorteos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "All authenticated users can read active sorteos"
  ON sorteos
  FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Admins can do everything with sorteos"
  ON sorteos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );