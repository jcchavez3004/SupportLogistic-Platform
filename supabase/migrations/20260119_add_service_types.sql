-- ============================================================================
-- MIGRACIÓN: Sistema de Tipos de Servicio Logístico
-- Fecha: 2026-01-19
-- Descripción: Agrega soporte para múltiples tipos de operación logística
-- ============================================================================

-- ============================================================================
-- 1. CREAR TABLA: service_types
-- Catálogo de tipos de servicio disponibles
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  requires_zoning BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios de documentación
COMMENT ON TABLE service_types IS 'Catálogo de tipos de servicio logístico disponibles';
COMMENT ON COLUMN service_types.name IS 'Nombre único del tipo de servicio';
COMMENT ON COLUMN service_types.description IS 'Descripción detallada del tipo de servicio';
COMMENT ON COLUMN service_types.requires_zoning IS 'Indica si el servicio requiere manejo por zonas/estibas';

-- Insertar tipos de servicio iniciales
INSERT INTO service_types (id, name, description, requires_zoning) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Recibo y Entrega', 'Flujo estándar de recogida en origen y entrega en destino. Incluye direcciones específicas de pickup y delivery.', FALSE),
  ('22222222-2222-2222-2222-222222222222', 'Servicio por Zonas', 'Operación masiva con manejo de zonas, estibas o sectores. Ideal para distribución a gran escala.', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. CREAR TABLA: client_services (Relación Many-to-Many)
-- Define qué servicios tiene habilitados cada cliente
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Evitar duplicados
  UNIQUE(client_id, service_type_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_client_services_client ON client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_service_type ON client_services(service_type_id);

-- Comentarios de documentación
COMMENT ON TABLE client_services IS 'Tabla intermedia que define los servicios habilitados por cliente';
COMMENT ON COLUMN client_services.enabled IS 'Permite deshabilitar temporalmente sin eliminar el registro';

-- ============================================================================
-- 3. ACTUALIZAR TABLA: services
-- Agregar columnas para tipo de servicio y zona
-- ============================================================================

-- Columna: service_type_id (FK a service_types)
-- Por defecto apunta a "Recibo y Entrega" para compatibilidad con datos existentes
ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS service_type_id UUID 
  REFERENCES service_types(id) ON DELETE SET NULL
  DEFAULT '11111111-1111-1111-1111-111111111111';

-- Columna: zone_label (para servicios por zonas)
ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS zone_label TEXT;

-- Índice para filtrar por tipo de servicio
CREATE INDEX IF NOT EXISTS idx_services_service_type ON services(service_type_id);

-- Comentarios de documentación
COMMENT ON COLUMN services.service_type_id IS 'Tipo de servicio logístico aplicado a este envío';
COMMENT ON COLUMN services.zone_label IS 'Etiqueta de zona/estiba para servicios de distribución masiva (ej: "Estiba 1", "Zona Norte")';

-- ============================================================================
-- 4. HABILITAR RLS (Row Level Security) PARA NUEVAS TABLAS
-- ============================================================================

-- RLS para service_types (lectura pública, solo admin puede modificar)
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer tipos de servicio"
  ON service_types
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Solo admins pueden modificar tipos de servicio"
  ON service_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- RLS para client_services
ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins y operadores pueden leer client_services"
  ON client_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'operador')
    )
    OR
    -- Clientes pueden ver sus propios servicios habilitados
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.client_id = client_services.client_id
    )
  );

CREATE POLICY "Solo super_admin puede modificar client_services"
  ON client_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================================================
-- 5. MIGRAR CLIENTES EXISTENTES
-- Habilitar "Recibo y Entrega" para todos los clientes actuales
-- ============================================================================
INSERT INTO client_services (client_id, service_type_id, enabled)
SELECT 
  c.id,
  '11111111-1111-1111-1111-111111111111', -- Recibo y Entrega
  TRUE
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM client_services cs 
  WHERE cs.client_id = c.id 
  AND cs.service_type_id = '11111111-1111-1111-1111-111111111111'
);

-- ============================================================================
-- 6. FUNCIÓN HELPER: Obtener servicios habilitados de un cliente
-- ============================================================================
CREATE OR REPLACE FUNCTION get_client_enabled_services(p_client_id UUID)
RETURNS TABLE(
  service_type_id UUID,
  name TEXT,
  description TEXT,
  requires_zoning BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id,
    st.name,
    st.description,
    st.requires_zoning
  FROM service_types st
  INNER JOIN client_services cs ON cs.service_type_id = st.id
  WHERE cs.client_id = p_client_id
  AND cs.enabled = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
