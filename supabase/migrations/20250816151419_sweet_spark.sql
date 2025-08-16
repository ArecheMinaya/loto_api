/*
  # Seed initial data for development and testing
  
  This file creates sample data including:
  - Admin user
  - Sample sorteos (lotteries)
  - Sample bancas
  - Sample vendedores
  - Sample assignments
  - Sample jugadas
  - Sample resultados
*/

-- Insert admin user (assuming auth.users record exists)
-- In production, this would be created through the auth flow
INSERT INTO usuarios (id, email, nombre, rol, estado) VALUES
  ('00000000-0000-4000-8000-000000000001', 'admin@ejemplo.com', 'Administrador Sistema', 'admin', 'activo'),
  ('00000000-0000-4000-8000-000000000002', 'supervisor@ejemplo.com', 'Supervisor Principal', 'supervisor', 'activo'),
  ('00000000-0000-4000-8000-000000000003', 'operador@ejemplo.com', 'Operador Banca 1', 'operador', 'activo')
ON CONFLICT (id) DO NOTHING;

-- Insert sample sorteos
INSERT INTO sorteos (id, nombre, codigo, horario, activo) VALUES
  ('10000000-0000-4000-8000-000000000001', 'Nacional', 'nacional', ARRAY['12:00', '18:00']::time[], true),
  ('10000000-0000-4000-8000-000000000002', 'Leidsa', 'leidsa', ARRAY['13:00', '19:00']::time[], true),
  ('10000000-0000-4000-8000-000000000003', 'Real', 'real', ARRAY['14:00', '20:00']::time[], true),
  ('10000000-0000-4000-8000-000000000004', 'Loto Pool', 'loto-pool', ARRAY['21:00']::time[], true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample bancas
INSERT INTO bancas (id, nombre, ubicacion, estado, ip_whitelist) VALUES
  ('20000000-0000-4000-8000-000000000001', 'Banca Central', 'Av. 27 de Febrero, Santo Domingo', 'activa', ARRAY['192.168.1.100', '10.0.0.50']),
  ('20000000-0000-4000-8000-000000000002', 'Banca Norte', 'Santiago de los Caballeros', 'activa', NULL),
  ('20000000-0000-4000-8000-000000000003', 'Banca Este', 'La Romana', 'activa', NULL),
  ('20000000-0000-4000-8000-000000000004', 'Banca Oeste', 'San Cristóbal', 'inactiva', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample vendedores
INSERT INTO vendedores (id, nombre, cedula, telefono, estado) VALUES
  ('30000000-0000-4000-8000-000000000001', 'Juan Pérez', '40212345678', '+1-809-555-0101', 'activo'),
  ('30000000-0000-4000-8000-000000000002', 'María García', '40287654321', '+1-809-555-0102', 'activo'),
  ('30000000-0000-4000-8000-000000000003', 'Pedro Martínez', '40298765432', '+1-809-555-0103', 'activo'),
  ('30000000-0000-4000-8000-000000000004', 'Ana Rodríguez', '40276543210', '+1-809-555-0104', 'inactivo')
ON CONFLICT (id) DO NOTHING;

-- Insert bancas-vendedores assignments
INSERT INTO bancas_vendedores (banca_id, vendedor_id) VALUES
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003')
ON CONFLICT (banca_id, vendedor_id) DO NOTHING;

-- Insert sample resultados (last 7 days)
DO $$
DECLARE
  i integer;
  fecha_actual date;
BEGIN
  FOR i IN 0..6 LOOP
    fecha_actual := CURRENT_DATE - i;
    
    -- Nacional results
    INSERT INTO resultados (sorteo_id, fecha, numeros, fuente, publicado) VALUES
      ('10000000-0000-4000-8000-000000000001', fecha_actual, '[12, 34, 56]', 'manual', true)
    ON CONFLICT (sorteo_id, fecha) DO NOTHING;
    
    -- Leidsa results
    INSERT INTO resultados (sorteo_id, fecha, numeros, fuente, publicado) VALUES
      ('10000000-0000-4000-8000-000000000002', fecha_actual, '[78, 90, 23]', 'manual', true)
    ON CONFLICT (sorteo_id, fecha) DO NOTHING;
    
    -- Real results
    INSERT INTO resultados (sorteo_id, fecha, numeros, fuente, publicado) VALUES
      ('10000000-0000-4000-8000-000000000003', fecha_actual, '[45, 67, 89]', 'manual', true)
    ON CONFLICT (sorteo_id, fecha) DO NOTHING;
  END LOOP;
END $$;

-- Insert sample jugadas (last 3 days)
DO $$
DECLARE
  i integer;
  j integer;
  fecha_hora timestamptz;
  banca_ids uuid[] := ARRAY[
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003'
  ];
  vendedor_ids uuid[] := ARRAY[
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000003'
  ];
  sorteo_ids uuid[] := ARRAY[
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003'
  ];
BEGIN
  FOR i IN 0..2 LOOP -- Last 3 days
    FOR j IN 1..10 LOOP -- 10 jugadas per day
      fecha_hora := (CURRENT_DATE - i)::timestamp + (j || ' hours')::interval;
      
      INSERT INTO jugadas (
        banca_id,
        vendedor_id,
        sorteo_id,
        fecha_hora,
        numeros,
        monto,
        estado,
        premio
      ) VALUES (
        banca_ids[1 + (j % 3)],
        vendedor_ids[1 + (j % 3)],
        sorteo_ids[1 + (j % 3)],
        fecha_hora,
        ('[' || (random() * 99)::int || ',' || (random() * 99)::int || ']')::jsonb,
        50 + (random() * 950)::numeric(14,2), -- Random amount 50-1000
        'valida',
        CASE WHEN random() < 0.1 THEN 100 + (random() * 5000)::numeric(14,2) ELSE 0 END -- 10% win chance
      );
    END LOOP;
  END LOOP;
END $$;