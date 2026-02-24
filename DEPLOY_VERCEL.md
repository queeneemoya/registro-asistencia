# Desplegar en Vercel

## 1. Subir el código a GitHub

Si aún no tienes el proyecto en GitHub:

```bash
cd registro-asistencia
git init
git add .
git commit -m "Initial commit - Registro asistencia Mechoneo"
```

Crea un repositorio nuevo en [github.com/new](https://github.com/new) (por ejemplo `registro-asistencia-mechoneo`). Luego:

```bash
git remote add origin https://github.com/TU_USUARIO/registro-asistencia-mechoneo.git
git branch -M main
git push -u origin main
```

*(Sustituye `TU_USUARIO` y el nombre del repo por los tuyos.)*

---

## 2. Conectar con Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión (con GitHub si quieres).
2. **Add New…** → **Project**.
3. **Import** el repositorio de GitHub que creaste.
4. Si tu código está en una **subcarpeta** (por ejemplo solo tienes `registro-asistencia` dentro del repo), en **Root Directory** elige esa carpeta (ej. `registro-asistencia`). Si el repo solo contiene este proyecto, deja **Root Directory** vacío.
5. **Framework Preset**: Vercel detectará Next.js.
6. No cambies **Build Command** (`next build`) ni **Output Directory**.

---

## 3. Variables de entorno

Antes de hacer **Deploy**, en la misma pantalla (o en **Settings → Environment Variables** del proyecto) añade:

| Nombre | Valor | Notas |
|--------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `sb_publishable_...` o la clave anónima | Clave pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Clave secreta (Service Role) de Supabase |
| `ADMIN_PASSWORD` | Tu contraseña segura | Contraseña del panel de administrador |

Marca estas variables para **Production**, **Preview** y **Development** si quieres que funcionen en todos los entornos.

---

## 4. Desplegar

Pulsa **Deploy**. Vercel instalará dependencias, hará `next build` y desplegará la app.

Al terminar te dará una URL como `https://registro-asistencia-mechoneo.vercel.app`. Ahí tendrás:

- **Inicio**: enlace a Usuario y Administrador  
- **Usuario**: `/usuario`  
- **Administrador**: `/admin` (usa la contraseña de `ADMIN_PASSWORD`)

---

## 5. Actualizaciones

Cada vez que hagas `git push` a la rama principal, Vercel generará un nuevo despliegue automáticamente.

---

## Si tu proyecto está en una carpeta dentro del escritorio

Si en tu Mac la ruta es algo como:

`Desktop/Registro de asistencia Mechoneo/registro-asistencia/`

tienes dos opciones:

**A)** Crear un repo solo con el contenido de `registro-asistencia` (recomendado):

```bash
cd "/Users/queeniecaveromoya/Desktop/Registro de asistencia Mechoneo/registro-asistencia"
git init
git add .
git commit -m "Initial commit"
# Crear repo en GitHub y luego:
git remote add origin https://github.com/TU_USUARIO/NOMBRE_REPO.git
git push -u origin main
```

En Vercel importas ese repo y **Root Directory** lo dejas vacío.

**B)** Si subes todo el folder "Registro de asistencia Mechoneo" al repo, en Vercel en **Root Directory** pon: `registro-asistencia`.
