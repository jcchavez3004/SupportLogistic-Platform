-- ============================================================================
-- Tabla field_drivers: directorio de conductores de campo (independiente de
-- profiles / driver_id). No modifica ni migra la columna services.driver_id.
-- ============================================================================

CREATE TABLE IF NOT EXISTS field_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  cedula text NOT NULL UNIQUE,
  vehicle_plate text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE field_drivers IS 'Directorio de conductores de campo; independiente de profiles.driver';
COMMENT ON COLUMN field_drivers.cedula IS 'Documento de identidad; único para autocompletado y deduplicación';

-- Índice explícito para búsquedas de autocompletado (además del UNIQUE)
CREATE INDEX IF NOT EXISTS idx_field_drivers_cedula ON field_drivers (cedula);

-- Relación opcional en services (no toca driver_id)
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS field_driver_id uuid REFERENCES field_drivers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_field_driver_id ON services (field_driver_id);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE field_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden leer field_drivers"
  ON field_drivers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins y operadores pueden insertar field_drivers"
  ON field_drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'operador')
    )
  );

CREATE POLICY "Admins y operadores pueden actualizar field_drivers"
  ON field_drivers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'operador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'operador')
    )
  );
