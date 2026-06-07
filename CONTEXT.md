# Contexto de Aplicación — Conjunto Residencial Prados II

## 1. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend framework | **Next.js** (App Router, `src/app`) |
| Lenguaje | **TypeScript** |
| UI Library | **Ant Design (antd)** + **Lucide React** |
| Estilos | **Tailwind CSS** (clases de utilidad directamente en JSX) |
| Backend | **Node.js + Express** (carpeta `ProyectoPrados2/PaginaPrados2`) |
| Base de datos | **MySQL** |
| Estado de autenticación | **React Context** (`AuthContext`) + `localStorage` |
| Dev server frontend | `npm run dev` en `FrontEnd/` |
| Dev server backend | Se corre por separado en `ProyectoPrados2/` |

---

## 2. Rutas de archivos principales

```
FrontEnd/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 ← Root layout (AntdApp, AuthProvider, MainLayout)
│   │   ├── page.tsx                   ← Muro Social (ruta /)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── pqrs/page.tsx              ← PQRS (peticiones, quejas, reclamos, felicitaciones)
│   │   ├── visitor-parking/page.tsx   ← Parqueadero de Visitante
│   │   ├── residents/page.tsx
│   │   ├── requests/
│   │   │   ├── parking/page.tsx
│   │   │   ├── social-hall/page.tsx
│   │   │   └── moving/page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── layout/
│   │       └── MainLayout.tsx         ← Sidebar, Header, Footer + lógica de menú por rol
│   ├── config/
│   │   └── api.ts                     ← Todas las rutas de API centralizadas
│   └── context/
│       └── AuthContext.tsx            ← Contexto de autenticación global

ProyectoPrados2/PaginaPrados2/
├── modulos/
│   ├── usuarios/          ← login, registro
│   ├── muro/
│   ├── residentes/
│   ├── parqueaderovisitante/
│   ├── pqrs/
│   ├── solicitudparqueadero/
│   ├── solicitudsalonessociales/
│   ├── solicitudtrasteos/
│   ├── funcionarios/
│   ├── propietario/
│   └── arrendatario/
└── DB/mysql.js            ← Pool de conexión MySQL
```

---

## 3. API — Endpoints

Archivo de config: `src/config/api.ts`
Base URL: `http://localhost:3001/api` (configurable con `NEXT_PUBLIC_API_BASE_URL`)

```ts
API_ROUTES = {
  PARKING:         '/api/solicitudparqueadero',
  MOVING:          '/api/solicitudtrasteos',
  SOCIAL_HALL:     '/api/solicitudsalonessociales',
  MURO:            '/api/muro',
  LOGIN:           '/api/usuarios/login',
  REGISTER:        '/api/usuarios',
  RESIDENTS:       '/api/residentes',
  VISITOR_PARKING: '/api/parqueaderovisitante',
  PQRS:            '/api/pqrs',
  UPLOAD_DIR:      'http://localhost:3001/uploads/',
}
```

Todas las respuestas del backend tienen la forma:
```json
{ "body": [...] }    // listas
{ "mensaje": "..." } // errores
```

---

## 4. Autenticación y Roles

### Modelo de usuario (`AuthContext.tsx`)
```ts
interface User {
  nombreUsuario: string;
  correo: string;
  cedula?: string | number;
  rol?: string; // 'administrador' | 'vigilante' | 'propietario' | 'arrendatario'
}
```
- Se guarda en `localStorage` con la clave `'user'`
- Se accede en cualquier componente con: `const { user, isAuthenticated, login, logout } = useAuth()`

### Roles reconocidos
| Valor en BD | Comparación en código |
|---|---|
| `administrador` | `user?.rol?.toLowerCase() === 'administrador'` |
| `vigilante` | `user?.rol?.toLowerCase() === 'vigilante'` |
| `propietario` | (cualquier otro autenticado) |
| `arrendatario` | (cualquier otro autenticado) |

---

## 5. Menú lateral — Visibilidad por Rol (`MainLayout.tsx`)

| Ítem de Menú | No autenticado | Propietario / Arrendatario | Vigilante | Administrador |
|---|:---:|:---:|:---:|:---:|
| Muro Social (`/`) | ✅ | ✅ | ✅ | ✅ |
| PQRS (`/pqrs`) | ❌ | ✅ | ✅ | ✅ |
| Parqueadero de Visitante (`/visitor-parking`) | ❌ | ❌ | ✅ | ✅ |
| Residentes (`/residents`) | ❌ | ✅ | ❌ | ✅ |
| Documentos (`/documents`) | ❌ | ✅ | ❌ | ✅ |
| Solicitudes (sub-menú) | ❌ | ✅ | ❌ | ✅ |
| Funcionarios (`/staff`) | ❌ | ✅ | ❌ | ✅ |
| Configuración (`/settings`) | ❌ | ✅ | ❌ | ✅ |

Lógica clave en `MainLayout.tsx`:
```ts
const userRole    = user?.rol?.toLowerCase();
const isVigilante = userRole === 'vigilante';
const isAdmin     = userRole === 'administrador';
// El vigilante ve: Muro Social + PQRS + Parqueadero de Visitante SOLAMENTE
// isAuthenticated && !isVigilante => muestra el resto del menú
```

---

## 6. Esquemas de payload por módulo

### Parqueadero de Visitante — `POST /api/parqueaderovisitante`
```json
{
  "idparqueaderovisitante": 1,
  "placa": "ABC123",
  "nombres": "Juan Ruiz",
  "cedula": "1125181138",
  "tipoParqueadero": "Carro | Moto | Bicicleta",
  "estado": 1,
  "horaIngreso": "2026-05-31T10:00:00",
  "horaSalida": null,
  "vigilanteIngreso": "nombreUsuario del logeado",
  "vigilanteSalida": null
}
```
- `horaIngreso` se genera con fecha/hora local del sistema
- `vigilanteIngreso` viene de `user.nombreUsuario`
- `horaSalida` y `vigilanteSalida` se dejan en `null` al registrar entrada

### PQRS — `POST /api/pqrs` (multipart/form-data)
```
idpqrs:        String(Date.now()).slice(-6)  // ID único temporal
fechaCreacion: localIso()                    // fecha/hora actual del sistema
idUsuario:     user.cedula || user.nombreUsuario
tipo:          "Petición" | "Queja" | "Reclamo" | "Felicitación"
descripcion:   string
estado:        "Pendiente"
evidencia:     File (imagen o PDF, opcional)
```
Respuesta esperada de la API al listar:
```json
{
  "body": [{
    "idpqrs": 1,
    "fechaCreacion": "...",
    "idUsuario": "...",
    "tipo": "...",
    "descripcion": "...",
    "evidencia": "nombre.jpg",
    "evidenciaUrl": "http://localhost:3001/uploads/nombre.jpg",
    "estado": "Pendiente"
  }]
}
```

---

## 7. Tablas MySQL relevantes

### `parqueaderovisitante`
```sql
idParqueaderoVisitante INT PK,
placa              VARCHAR,
nombres            VARCHAR,
cedula             VARCHAR,
tipoParqueadero    VARCHAR,
estado             INT,        -- 1 = activo
horaIngreso        DATETIME,
horaSalida         DATETIME NULL,
vigilanteIngreso   VARCHAR NULL,
vigilanteSalida    VARCHAR NULL
```

### `pqrs`
```sql
idpqrs        INT PK AUTO_INCREMENT,
fechaCreacion DATETIME,
idUsuario     VARCHAR,        -- cedula del usuario
tipo          VARCHAR,
descripcion   TEXT,
evidencia     VARCHAR NULL,   -- nombre del archivo
estado        VARCHAR,        -- 'Pendiente' | 'En Proceso' | 'Resuelto'
respuesta     TEXT NULL       -- respuesta del administrador
```

### `usuarios`
```sql
cedula        VARCHAR PK,
nombreUsuario VARCHAR,
correo        VARCHAR,
contrasena    VARCHAR,
rol           VARCHAR  -- 'administrador' | 'vigilante' | 'propietario' | 'arrendatario'
```

---

## 8. Patrones y convenciones del proyecto

### Fetch de datos
```ts
const res  = await fetch(API_ROUTES.ENDPOINT);
const data = await res.json();
if (data?.body) setList(data.body);
```

### Protección de rutas por rol (en page.tsx)
```ts
useEffect(() => {
  if (!isAuthenticated) { router.push('/login'); return; }
  if (user?.rol?.toLowerCase() !== 'administrador') {
    message.error('Sin permisos'); router.push('/');
  }
}, [user, isAuthenticated, router]);
// Early return para evitar flash antes del redirect:
if (!isAuthenticated || condicionRol) return null;
```

### Mensajes de UI
- Se usa `const { message } = AntdApp.useApp()` (NO el `message` global de antd)
- El layout root envuelve todo en `<App>` de antd para que funcione

### Estilos globales de tabla (patrón reutilizable)
```css
.mi-tabla .ant-table-thead > tr > th {
  background: #f8fafc !important;
  color: #64748b !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  font-size: 11px !important;
}
.mi-tabla .ant-table-tbody > tr > td { padding: 16px !important; }
.mi-tabla .ant-table-row:hover > td  { background: #f0fdf4 !important; }
```

### Colores del tema principal
- **Primario / acento:** `emerald-500` → `#10b981`
- **Sidebar (dark):** `#1e293b` (slate-900)
- **Fondo de página:** `#f8fafc`
- **Texto principal:** `slate-800` / `slate-900`

---

## 9. Variables de entorno

```env
# FrontEnd/.env.local (opcional, por defecto usa localhost)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

---

## 10. Comandos útiles

```bash
# Iniciar frontend
cd "FrontEnd"
npm run dev          # http://localhost:3000

# Iniciar backend (en otra terminal)
cd "ProyectoPrados2/PaginaPrados2"
node index.js        # o: npm start → http://localhost:3001
```
