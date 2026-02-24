# Registro de Asistencia - Mechoneo

Aplicación web con **Next.js**, **Tailwind CSS** y **Supabase (PostgreSQL)** para registro de asistencia y restricciones alimentarias.

## Funcionalidades

### Vista Usuario
- Buscar por RUT (con dígito verificador).
- Ver nombre y **carrera**.
- Registrar asistencia (obligatorio).
- Indicar restricción alimentaria: ninguna, celíaco o vegetariano/vegano.

### Vista Administrador
- Subir archivo **XLS/XLSX** con columnas: RUT, DV, nombres, apellido paterno, apellido materno, correo UAI, sección CORE, **carrera**.
- Ver listado de personas **registradas** y **no registradas** (con columna Carrera y Sección).
- Editar datos de personas (incl. carrera).
- Añadir personas manualmente (fuera de la lista del archivo).
- Ver **conteo general** (total, registrados, sin registrar).
- Ver **conteo por sección CORE** y **por carrera**.

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com).

## Configuración

### 1. Variables de entorno

Copia el ejemplo y complétalo con los datos de tu proyecto Supabase:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto (Settings → API).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave anónima (Settings → API).
- `SUPABASE_SERVICE_ROLE_KEY`: clave service role (Settings → API). **No exponer en el front.**
- `ADMIN_PASSWORD`: contraseña para acceder al panel de administrador.

### 2. Base de datos en Supabase

En el **SQL Editor** de tu proyecto Supabase, ejecuta el contenido del archivo:

```
supabase/schema.sql
```

Crea las tablas `personas` y `asistencias` con los índices y políticas RLS indicados.

### 3. Instalación y ejecución

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

- **Usuario:** [http://localhost:3000/usuario](http://localhost:3000/usuario).
- **Administrador:** [http://localhost:3000/admin](http://localhost:3000/admin) (pedirá la contraseña configurada en `ADMIN_PASSWORD`).

## Formato del archivo XLS

El archivo debe tener una primera hoja con cabeceras (primera fila). Nombres de columna esperados (mayúsculas/minúsculas y espacios flexibles):

| RUT | DV | nombres | apellido paterno | apellido materno | correo UAI | sección CORE | carrera |
|-----|----|---------|------------------|------------------|------------|--------------|---------|

Puedes usar variantes como "correo UAI", "seccion core", "carrera", etc. El sistema hace coincidencia flexible por nombre de columna. La columna **carrera** es la que ve el usuario al buscar por RUT.

## Estructura del proyecto

- `src/app/page.tsx` – Inicio (enlaces Usuario / Administrador).
- `src/app/usuario/page.tsx` – Buscador por RUT y registro de asistencia.
- `src/app/admin/page.tsx` – Login administrador.
- `src/app/admin/dashboard/page.tsx` – Panel: subida XLS, listados, edición, conteos.
- `src/app/api/` – Rutas API (buscar persona, registrar asistencia, admin: personas, upload, stats).
- `src/lib/supabase.ts` – Cliente Supabase.
- `src/lib/admin-auth.ts` – Sesión administrador por cookie.
- `supabase/schema.sql` – Esquema PostgreSQL para Supabase.

## Tecnologías

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Supabase** (PostgreSQL, cliente JS)
- **xlsx** – Lectura de archivos Excel
