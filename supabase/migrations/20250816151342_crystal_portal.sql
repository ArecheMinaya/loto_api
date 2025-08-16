/*
  # Create jugadas table

  1. New Tables
    - `jugadas`
      - `id` (uuid, primary key)
      - `banca_id` (uuid, foreign key to bancas)
      - `vendedor_id` (uuid, foreign key to vendedores)
      - `sorteo_id` (uuid, foreign key to sorteos)
      - `fecha_hora` (timestamptz, when the bet was placed)
      - `numeros` (jsonb, array of bet numbers)
      - `monto` (numeric, bet amount in DOP)
      - `estado` (enum: valida, anulada)
      - `premio` (numeric, prize amount, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Constraints
    - Check constraints on monto and premio (must be >= 0)
    - Check constraint on numeros format
  
  3. Security
    - Enable RLS on `jugadas` table
    - Complex policies based on user roles and banca assignments
  
  4. Indexes
    - Composite index on (banca_id, fecha_hora) for reporting
    - Index on (vendedor_id, fecha_hora) for vendor reports
    - Index on (sorteo_id, fecha_hora) for lottery reports
    - GIN index on numeros for number searches
    - Index on estado for filtering
*/

-- Create estado enum for jugadas
CREATE TYPE jugada_estado AS ENUM ('valida', 'anulada');

-- Create jugadas table
CREATE TABLE IF NOT EXISTS jugadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banca_id uuid NOT NULL REFERENCES bancas(id) ON DELETE RESTRICT,
  vendedor_id uuid NOT NULL REFERENCES vendedores(id) ON DELETE RESTRICT,
  sorteo_id uuid NOT NULL REFERENCES sorteos(id) ON DELETE RESTRICT,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  numeros jsonb NOT NULL,
  monto numeric(14,2) NOT NULL,
  estado jugada_estado NOT NULL DEFAULT 'valida',
  premio numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (monto > 0),
  CHECK (premio >= 0),
  CHECK (jsonb_array_length(numeros) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jugadas_banca_fecha ON jugadas(banca_id, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_jugadas_vendedor_fecha ON jugadas(vendedor_id, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_jugadas_sorteo_fecha ON jugadas(sorteo_id, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_jugadas_numeros ON jugadas USING GIN (numeros);
CREATE INDEX IF NOT EXISTS idx_jugadas_estado ON jugadas(estado);
CREATE INDEX IF NOT EXISTS idx_jugadas_fecha_hora ON jugadas(fecha_hora DESC);

-- Enable RLS
ALTER TABLE jugadas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can do everything with jugadas"
  ON jugadas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Supervisors can read all jugadas"
  ON jugadas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Supervisors can anular jugadas"
  ON jugadas
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Operadores can read jugadas from their assigned bancas"
  ON jugadas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() 
        AND u.rol = 'operador'
        AND EXISTS (
          SELECT 1 FROM bancas_vendedores bv
          WHERE bv.banca_id = jugadas.banca_id
            AND bv.vendedor_id IN (
              SELECT id FROM vendedores WHERE id = auth.uid()
            )
        )
    )
  );

CREATE POLICY "Operadores can create jugadas in their assigned bancas"
  ON jugadas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() 
        AND u.rol = 'operador'
        AND EXISTS (
          SELECT 1 FROM bancas_vendedores bv
          WHERE bv.banca_id = banca_id
            AND bv.vendedor_id = vendedor_id
        )
    )
  );