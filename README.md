# SupportLogistic Platform

Plataforma SaaS de logística integral para gestión de envíos, conductores y evidencias en tiempo real.

---

## 📋 Descripción del Proyecto

**SupportLogistic** es una plataforma web diseñada para empresas de logística que necesitan:

- Gestionar solicitudes de envío de múltiples clientes empresariales
- Asignar conductores a servicios de forma inteligente
- Rastrear el ciclo de vida completo de cada envío
- Capturar evidencia fotográfica de entregas
- Ofrecer portales diferenciados según el rol del usuario

### Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| **Super Admin** | Control total de la plataforma, gestión de clientes y configuración |
| **Operador** | Staff interno que gestiona servicios y asigna conductores |
| **Cliente** | Empresas que solicitan envíos y rastrean sus pedidos |
| **Conductor** | Personal de campo que ejecuta recogidas y entregas |

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Next.js 16** | Framework React con App Router (Server Components, Server Actions) |
| **Supabase** | Backend as a Service (Auth, PostgreSQL, Storage, RLS) |
| **TypeScript** | Tipado estático para mayor robustez |
| **Tailwind CSS 4** | Estilos utility-first responsive |
| **Lucide React** | Iconografía moderna y consistente |
| **clsx** | Utilidad para clases condicionales |

---

## 🗄️ Arquitectura de Base de Datos

### Tablas Principales

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  profiles   │       │   clients   │       │  services   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ email       │       │ company_name│       │ client_id   │──→ clients.id
│ full_name   │       │ nit         │       │ driver_id   │──→ profiles.id
│ role        │       │ address     │       │ status      │
│ client_id   │──→    │ logo_url    │       │ pickup_*    │
│ phone       │       │ created_at  │       │ delivery_*  │
│ vehicle_plate│      └─────────────┘       │ evidence_url│
│ status      │                             │ created_at  │
└─────────────┘                             └─────────────┘
```

### Tabla `profiles`
Extiende `auth.users` de Supabase con información de perfil y rol.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | FK a `auth.users.id` |
| `role` | TEXT | `super_admin`, `operador`, `cliente`, `conductor` |
| `client_id` | UUID | Solo para rol `cliente`: vincula al registro de `clients` |
| `full_name` | TEXT | Nombre completo |
| `phone` | TEXT | Teléfono de contacto |
| `vehicle_plate` | TEXT | Solo para conductores: placa del vehículo |

### Tabla `clients`
Empresas/clientes que solicitan servicios de envío.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `company_name` | TEXT | Nombre de la empresa |
| `nit` | TEXT | Identificación fiscal |
| `address` | TEXT | Dirección principal |
| `logo_url` | TEXT | URL del logo corporativo |

### Tabla `services`
Registro de cada servicio de envío.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `client_id` | UUID | Empresa que solicita el servicio |
| `driver_id` | UUID | Conductor asignado (nullable) |
| `status` | TEXT | Estado del ciclo de vida |
| `pickup_address` | TEXT | Dirección de recogida |
| `pickup_contact_name` | TEXT | Contacto en recogida |
| `pickup_phone` | TEXT | Teléfono de recogida |
| `delivery_address` | TEXT | Dirección de entrega |
| `delivery_contact_name` | TEXT | Contacto en entrega |
| `delivery_phone` | TEXT | Teléfono de entrega |
| `observations` | TEXT | Notas adicionales |
| `evidence_photo_url` | TEXT | URL de foto de evidencia |

### Estados del Servicio (`service_status`)

```
solicitado → asignado → en_curso_recogida → recogido → en_curso_entrega → entregado
                                                                      ↘ novedad
```

---

## 🔐 Políticas RLS (Row Level Security)

Supabase RLS protege los datos a nivel de fila. Políticas recomendadas:

### `profiles`
```sql
-- Usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Admins pueden leer todos los perfiles
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

### `clients`
```sql
-- Admins y operadores pueden ver todos los clientes
CREATE POLICY "Staff can read clients"
ON clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'operador')
  )
);

-- Solo super_admin puede crear clientes
CREATE POLICY "Only admin can insert clients"
ON clients FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

### `services`
```sql
-- Clientes solo ven sus propios servicios
CREATE POLICY "Clients see own services"
ON services FOR SELECT
USING (
  client_id = (
    SELECT client_id FROM profiles WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'operador')
  )
);
```

---

## 👥 Roles y Permisos (RBAC)

### Matriz de Permisos

| Funcionalidad | Super Admin | Operador | Cliente |
|---------------|:-----------:|:--------:|:-------:|
| **Dashboard** | ✅ | ✅ | ✅ |
| **Ver Clientes** | ✅ | ✅ (solo lectura) | ❌ |
| **Crear Clientes** | ✅ | ❌ | ❌ |
| **Ver Servicios** | ✅ Todos | ✅ Todos | ✅ Solo propios |
| **Crear Servicios** | ✅ + elegir cliente | ✅ + elegir cliente | ✅ (auto-asigna su empresa) |
| **Asignar Conductores** | ✅ | ✅ | ❌ |
| **Cambiar Estado** | ✅ | ✅ | ❌ |
| **Subir Evidencia** | ✅ | ✅ | ❌ |
| **Ver Conductores** | ✅ | ✅ | ❌ |

### Implementación en Frontend

```
app/dashboard/
├── layout.tsx          # Obtiene perfil y pasa rol al Sidebar
├── components/
│   └── DashboardSidebar.tsx  # Filtra enlaces según rol
├── clients/
│   └── page.tsx        # Oculta botón "Nuevo" si rol ≠ super_admin
└── services/
    ├── page.tsx        # Filtra servicios si es cliente
    └── components/
        ├── NewServiceModal.tsx   # Oculta select de cliente si es cliente
        └── ServicesTable.tsx     # Oculta columnas según rol
```

### Implementación en Backend (Server Actions)

```typescript
// createNewService verifica rol y fuerza client_id si es cliente
if (role === 'cliente') {
  client_id = profileClientId  // Ignora valor del formulario
}
```

---

## 🔄 Flujos Clave

### 1. Creación de Servicios

**Admin/Operador:**
1. Clic en "Nuevo Servicio"
2. Selecciona cliente del dropdown
3. Completa datos de recogida y entrega
4. Guarda → Estado inicial: `solicitado`

**Cliente:**
1. Clic en "Solicitar Envío"
2. NO ve selector de empresa (se inyecta automáticamente)
3. Completa datos de recogida y entrega
4. Guarda → Estado inicial: `solicitado`

### 2. Asignación de Conductores

1. Admin/Operador ve servicio en estado `solicitado`
2. Clic en botón "Asignar" en columna Conductor
3. Selecciona conductor del modal
4. Guarda → Estado cambia a `asignado`

### 3. Ciclo de Estados

```
Admin/Operador puede cambiar estado desde dropdown en la tabla:

solicitado ──[asignar conductor]──→ asignado
asignado ──────────────────────────→ en_curso_recogida
en_curso_recogida ─────────────────→ recogido
recogido ──────────────────────────→ en_curso_entrega
en_curso_entrega ──────────────────→ entregado
cualquier estado ──────────────────→ novedad
```

### 4. Carga de Evidencia Fotográfica

1. Servicio debe estar en proceso o entregado
2. Admin/Operador hace clic en icono de cámara 📷
3. Selecciona imagen (max 6MB, solo imágenes)
4. Se sube a Supabase Storage bucket `evidence`
5. URL se guarda en `services.evidence_photo_url`
6. Estado cambia automáticamente a `entregado`
7. Icono cambia a ojo 👁️ para ver la foto

---

## 🚀 Instalación y Despliegue

### Requisitos Previos

- Node.js 18+
- npm o pnpm
- Cuenta en Supabase

### 1. Clonar y configurar

```bash
git clone <repo-url>
cd support-logistic-app
npm install
```

### 2. Variables de Entorno

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Configurar Supabase

1. Crear tablas `profiles`, `clients`, `services` con las columnas documentadas
2. Crear bucket de Storage `evidence` (público)
3. Aplicar políticas RLS según la sección de seguridad
4. Crear trigger para auto-crear perfil en `profiles` al registrar usuario

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### 5. Build de producción

```bash
npm run build
npm start
```

---

## 📁 Estructura del Proyecto

```
support-logistic-app/
├── app/
│   ├── page.tsx                 # Landing pública
│   ├── login/
│   │   ├── page.tsx             # Formulario de login
│   │   └── actions.ts           # Server Action de auth
│   └── dashboard/
│       ├── layout.tsx           # Layout con Sidebar + Header
│       ├── page.tsx             # Dashboard principal
│       ├── components/
│       │   ├── DashboardSidebar.tsx
│       │   └── DashboardHeader.tsx
│       ├── clients/
│       │   ├── page.tsx
│       │   ├── actions.ts
│       │   └── components/
│       ├── services/
│       │   ├── page.tsx
│       │   ├── actions.ts
│       │   └── components/
│       └── drivers/
│           ├── page.tsx
│           └── actions.ts
├── utils/
│   └── supabase/
│       ├── client.ts            # Cliente browser
│       ├── server.ts            # Cliente server (cookies)
│       └── getCurrentProfile.ts # Helper RBAC
├── types/
│   └── database.types.ts        # Tipos TypeScript de Supabase
├── middleware.ts                # Refresh de sesión
└── public/
    └── logo.png
```

---

## 📝 Notas para Desarrollo Futuro

- [ ] Implementar vista móvil para conductores (PWA)
- [ ] Agregar notificaciones en tiempo real (Supabase Realtime)
- [ ] Dashboard con métricas y gráficos
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Integración con APIs de geolocalización
- [ ] Sistema de facturación

---

## 📄 Licencia

Proyecto privado - © 2026 Support Logistic

---

*Documentación generada el 19 de Enero de 2026*
