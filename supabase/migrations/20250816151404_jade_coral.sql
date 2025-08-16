/*
  # Create audit triggers for automatic logging

  1. Functions
    - `auditar_cambios()` - Generic audit function for INSERT/UPDATE/DELETE
    - `calcular_premios()` - Calculate prizes when results are published
  
  2. Triggers
    - Audit triggers for bancas, vendedores, jugadas, resultados
    - Prize calculation trigger for resultados
  
  3. Notes
    - Audit function captures old and new values
    - Prize calculation is a stub - implement business logic
*/

-- Generic audit function
CREATE OR REPLACE FUNCTION auditar_cambios()
RETURNS trigger AS $$
DECLARE
  usuario_actual uuid;
  ip_actual inet;
BEGIN
  -- Get current user (may be null for system operations)
  usuario_actual := auth.uid();
  
  -- Insert audit record
  INSERT INTO auditoria (
    usuario_id,
    entidad,
    entidad_id,
    accion,
    detalles,
    ip
  ) VALUES (
    usuario_actual,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    ),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Prize calculation function (stub implementation)
CREATE OR REPLACE FUNCTION calcular_premios()
RETURNS trigger AS $$
BEGIN
  -- Only calculate when result is being published
  IF OLD.publicado = false AND NEW.publicado = true THEN
    -- Update prizes for matching jugadas
    -- This is a simplified implementation - replace with actual business logic
    UPDATE jugadas SET
      premio = CASE
        WHEN numeros ?| array(SELECT jsonb_array_elements_text(NEW.numeros))
        THEN monto * 70  -- 70x multiplier for exact match (example)
        ELSE 0
      END,
      updated_at = now()
    WHERE sorteo_id = NEW.sorteo_id
      AND fecha_hora::date = NEW.fecha
      AND estado = 'valida';
    
    -- Log the prize calculation
    INSERT INTO auditoria (
      usuario_id,
      entidad,
      entidad_id,
      accion,
      detalles
    ) VALUES (
      auth.uid(),
      'jugadas',
      null,
      'CALCULATE_PRIZES',
      jsonb_build_object(
        'sorteo_id', NEW.sorteo_id,
        'fecha', NEW.fecha,
        'numeros_ganadores', NEW.numeros
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for key tables
CREATE TRIGGER audit_bancas_changes
  AFTER INSERT OR UPDATE OR DELETE ON bancas
  FOR EACH ROW EXECUTE FUNCTION auditar_cambios();

CREATE TRIGGER audit_vendedores_changes
  AFTER INSERT OR UPDATE OR DELETE ON vendedores
  FOR EACH ROW EXECUTE FUNCTION auditar_cambios();

CREATE TRIGGER audit_jugadas_changes
  AFTER INSERT OR UPDATE OR DELETE ON jugadas
  FOR EACH ROW EXECUTE FUNCTION auditar_cambios();

CREATE TRIGGER audit_resultados_changes
  AFTER INSERT OR UPDATE OR DELETE ON resultados
  FOR EACH ROW EXECUTE FUNCTION auditar_cambios();

CREATE TRIGGER audit_usuarios_changes
  AFTER INSERT OR UPDATE OR DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION auditar_cambios();

-- Prize calculation trigger
CREATE TRIGGER calculate_prizes_on_publish
  AFTER UPDATE ON resultados
  FOR EACH ROW EXECUTE FUNCTION calcular_premios();