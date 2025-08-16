/*
  # Create resultados table

  1. New Tables
    - `resultados`
      - `id` (uuid, primary key)
      - `sorteo_id` (uuid, foreign key to sorteos)
      - `fecha` (date, not null)
      - `numeros` (jsonb, array of winning numbers)
      - `fuente` (enum: manual, automatico)
      - `publicado` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Constraints
    - Unique constraint on (sorteo_id, fecha)
    - Check constraint on numeros format
  
  3. Security
    - Enable RLS on `resultados` table
    - All users can read published results
    - Only admins/supervisors can manage results
  
  4. Indexes
    - Index on (sorteo_id, fecha) for lookups
    - Index on publicado for filtering
    - Index on fecha for date range queries
*/

-- Create fuente enum for resultados
CREATE TYPE resultado_fuente AS ENUM ('manual', 'automatico');

-- Create resultados table
CREATE TABLE IF NOT EXISTS resultados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id uuid NOT NULL REFERENCES sorteos(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  numeros jsonb NOT NULL,
  fuente resultado_fuente NOT NULL DEFAULT 'manual',
  publicado boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sorteo_id, fecha),
  CHECK (jsonb_array_length(numeros) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resultados_sorteo_fecha ON resultados(sorteo_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_resultados_publicado ON resultados(publicado);
CREATE INDEX IF NOT EXISTS idx_resultados_fecha ON resultados(fecha DESC);

-- Enable RLS
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "All users can read published resultados"
  ON resultados
  FOR SELECT
  TO authenticated
  USING (publicado = true);

CREATE POLICY "Admins can do everything with resultados"
  ON resultados
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Supervisors can read and publish resultados"
  ON resultados
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol IN ('supervisor', 'admin')
    )
  );