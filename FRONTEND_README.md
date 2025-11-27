# 🎨 Frontend - Sistema de Publicaciones
#aa
## ✅ Aplicación Frontend Completada

Frontend desarrollado con **React + TypeScript + Material-UI** que se conecta al backend de publicaciones.

## 🚀 Características Implementadas

### ✅ Módulo de Publicaciones Completo

#### 1. **Lista de Publicaciones** (`/publicaciones`)
- Vista en grid responsive de todas las publicaciones
- Muestra título, descripción, categoría, estado y multimedia
- Barra de búsqueda por título/descripción
- Indicador de cantidad de fotos
- Chips de estado con colores personalizados
- Botón para crear nueva publicación

#### 2. **Crear Publicación** (`/publicaciones/crear`)
- Formulario completo con validaciones
- Galería de imágenes con soporte para múltiples fotos
- Vista previa de imágenes con thumbnails
- Selector de categorías (dinámico desde el backend)
- Campo de título (5-100 caracteres)
- Campo de descripción (10-1000 caracteres)
- Campo de precio
- Indicadores visuales de validación (checkmarks verdes)
- Botón de envío con feedback visual

#### 3. **Ver Detalle** (`/publicaciones/:id`)
- Vista completa de la publicación
- Galería de imágenes con navegación
- Información completa: título, descripción, categoría, vendedor
- Indicadores de interacción (vistas, likes, interesados)
- Chips de estado con colores
- Botones de acción: Editar y Eliminar
- Dialog de confirmación para eliminar
- Funcionalidad de compartir

#### 4. **Editar Publicación** (`/publicaciones/editar/:id`)
- Pre-carga de datos existentes
- Edición de título, descripción, categoría
- Gestión de multimedia: agregar/eliminar imágenes
- Botones de reordenar y establecer portada
- Dialog de confirmación antes de guardar
- Actualización en tiempo real con el backend

## 🎨 Diseño UI/UX

### Colores Principales
- **Verde Principal**: `#4CAF50` - Botones, acciones positivas
- **Verde Oscuro**: `#2E7D32` - Títulos, texto importante
- **Rojo**: `#EF5350` - Eliminar, rechazado
- **Naranja**: `#FFA726` - En revisión, pausado
- **Azul**: `#42A5F5` - Vendido
- **Gris**: `#757575` - Borrador

### Estados de Publicación
- `EN REVISION` 🟠 - Naranja
- `BORRADOR` ⚪ - Gris
- `ACTIVO` 🟢 - Verde
- `PAUSADO` 🟠 - Naranja
- `VENDIDO` 🔵 - Azul
- `RECHAZADO` 🔴 - Rojo

### Componentes UI
- **Header verde** con título y navegación
- **Cards con sombras** y hover effects
- **Botones redondeados** (border-radius: 25px)
- **Iconos de Material-UI**
- **Snackbars** para notificaciones
- **Dialogs** para confirmaciones
- **Progress indicators** para carga

## 📡 Integración con Backend

### Servicios API Implementados

#### PublicacionesService
```typescript
- getAll() - Obtiene todas las publicaciones
- getById(id) - Obtiene una publicación específica
- create(data) - Crea nueva publicación
- update(id, data) - Actualiza publicación
- delete(id) - Elimina publicación
- changeStatus(id, estado) - Cambia estado
- addMultimedia(id, multimedia) - Agrega imagen/video
- deleteMultimedia(id) - Elimina multimedia
```

#### CategoriasService
```typescript
- getAll() - Obtiene todas las categorías
- getActive() - Obtiene solo categorías activas
- getById(id) - Obtiene categoría específica
```

### Configuración API
```typescript
API_BASE_URL = 'http://localhost:4000/api'
```

## 🗂️ Estructura de Archivos

```
src/
├── services/
│   ├── api.ts                          # Configuración de Axios
│   ├── publicaciones.service.ts        # Servicio de publicaciones
│   └── categorias.service.ts           # Servicio de categorías
├── views/
│   └── publicaciones/
│       ├── PublicacionesList.tsx       # Lista de publicaciones
│       ├── CreatePublicacion.tsx       # Crear publicación
│       ├── PublicacionDetail.tsx       # Ver detalle
│       └── EditPublicacion.tsx         # Editar publicación
├── routes/
│   └── Routes.tsx                      # Configuración de rutas
└── layouts/
    └── dashboardLayout/
        └── menuHeader/
            ├── HeaderGPI.tsx           # Menú principal
            └── DrawerNav.tsx           # Drawer móvil
```

## 🚀 Cómo Usar

### 1. Instalar Dependencias

```bash
cd GPI_FrontTemplate
pnpm install
```

### 2. Iniciar Servidor de Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en: **http://localhost:4041**

### 3. Asegurarse que el Backend esté corriendo

```bash
cd GPI_BackTemplate
pnpm start:dev
```

Backend debe estar en: **http://localhost:3000/api**

## 📱 Rutas Disponibles

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/publicaciones` | PublicacionesList | Lista todas las publicaciones |
| `/publicaciones/crear` | CreatePublicacion | Formulario de nueva publicación |
| `/publicaciones/:id` | PublicacionDetail | Detalle de publicación |
| `/publicaciones/editar/:id` | EditPublicacion | Editar publicación |

## 🎯 Flujo de Usuario

### Crear Nueva Publicación
1. Click en "Nueva Publicación" en la lista
2. Agregar imágenes (opcional)
3. Llenar título (mínimo 5 caracteres)
4. Escribir descripción (mínimo 10 caracteres)
5. Seleccionar categoría
6. Ingresar precio
7. Click en "Subir Publicación"
8. Se redirige al detalle de la publicación creada

### Ver y Gestionar Publicación
1. Click en una tarjeta de publicación
2. Ver toda la información y galería
3. Opciones:
   - **Editar**: Modificar datos y multimedia
   - **Eliminar**: Confirmar y eliminar
   - **Compartir**: Copiar enlace

### Editar Publicación
1. Click en "Editar Publicación"
2. Modificar campos necesarios
3. Agregar/eliminar imágenes
4. Click en "Guardar Cambios"
5. Confirmar en el dialog
6. Se redirige al detalle actualizado

## ✨ Características Destacadas

### 1. **Validación en Tiempo Real**
- Checkmarks verdes cuando el campo es válido
- Mensajes de error claros
- Contadores de caracteres
- Prevención de envío con datos inválidos

### 2. **Gestión de Multimedia**
- Vista previa de imágenes
- Navegación entre imágenes
- Eliminar imágenes individualmente
- Soporte para agregar hasta 6 fotos
- Indicador de posición (ej: 3/6)

### 3. **Feedback Visual**
- Snackbars para operaciones exitosas/fallidas
- Progress bars durante carga
- Dialogs de confirmación
- Hover effects en tarjetas
- Animaciones suaves

### 4. **Responsive Design**
- Adaptado para móvil y desktop
- Grid responsive
- Menú adaptativo
- Touch-friendly

## 🔧 Dependencias Principales

```json
{
  "@mui/material": "^6.4.2",
  "@mui/icons-material": "^6.4.2",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.0",
  "axios": "^1.8.3",
  "react": "^19.0.0",
  "react-router-dom": "^7.1.5",
  "tailwindcss": "^4.0.3"
}
```

## 📸 Screenshots de Funcionalidades

### Lista de Publicaciones
- ✅ Grid responsive con tarjetas
- ✅ Barra de búsqueda
- ✅ Botón "Nueva Publicación"
- ✅ Chips de estado con colores
- ✅ Preview de primera imagen

### Crear/Editar
- ✅ Galería de imágenes con thumbnails
- ✅ Formulario con validaciones
- ✅ Selector de categorías dinámico
- ✅ Indicadores de progreso
- ✅ Botones de acción verdes

### Detalle
- ✅ Galería de imágenes a pantalla completa
- ✅ Información completa de la publicación
- ✅ Botones de editar y eliminar
- ✅ Indicadores de interacción
- ✅ Estado visual con chip

## 🎨 Personalización de Estilos

Los estilos están implementados con:
- **Material-UI `sx` prop** para estilos inline
- **Tailwind CSS** para utilidades
- **CSS-in-JS** con Emotion

Colores principales definidos en cada componente:
```typescript
const ESTADO_COLORS = {
  'EN REVISION': '#FFA726',
  'ACTIVO': '#66BB6A',
  'RECHAZADO': '#EF5350',
  // ...
};
```

## 🔒 Seguridad y Buenas Prácticas

- ✅ Validación de inputs en frontend
- ✅ Manejo de errores con try-catch
- ✅ Feedback claro al usuario
- ✅ Confirmaciones antes de acciones destructivas
- ✅ TypeScript para type-safety
- ✅ Axios interceptors para manejo de errores

## 📝 TODOs y Mejoras Futuras

- [ ] Implementar autenticación real
- [ ] Subida de imágenes a servidor (actualmente URLs)
- [ ] Paginación en lista de publicaciones
- [ ] Filtros avanzados por categoría y estado
- [ ] Ordenamiento (más reciente, alfabético)
- [ ] Modo oscuro
- [ ] Caché de datos con React Query
- [ ] Optimistic UI updates

## 🎉 ¡Todo Listo!

El frontend está completamente funcional y conectado al backend. Todos los mockups están implementados con los colores y diseños especificados.

**Para empezar a usar:**
1. Backend: `pnpm start:dev` en `GPI_BackTemplate`
2. Frontend: `pnpm dev` en `GPI_FrontTemplate`
3. Abrir http://localhost:4041
4. Navegar a "Publicaciones" en el menú
5. ¡Crear tu primera publicación!

- **URLs:**
- Frontend: http://localhost:4041
- Backend API: http://localhost:3000/api
- Prisma Studio: `pnpm prisma:studio` (puerto 5555)
