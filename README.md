# Mi Patrimonio

App personal de finanzas para iPhone: cuentas, gastos e ingresos, presupuestos y patrimonio neto en pesos, con el dólar oficial venta del Banco Nación actualizado automáticamente.

Se instala desde Safari como una app (ícono propio, pantalla completa) y funciona sin conexión. Los cambios se guardan en el teléfono y se suben solos cuando vuelve la señal.

## Instalación (una sola vez)

### 1. Base de datos en Supabase
1. En supabase.com, abrí tu proyecto `mi-patrimonio`.
2. Andá a **SQL Editor → New query**, pegá todo el contenido de `supabase/schema.sql` y tocá **Run**. Tiene que decir *Success*.
3. Andá a **Authentication → URL Configuration** y en **Site URL** poné la dirección que te dé Vercel en el paso 2 (por ejemplo `https://mi-patrimonio.vercel.app`).
4. Andá a **Project Settings → API Keys** (o **API**) y dejá a mano:
   - la **URL del proyecto** (`https://xxxx.supabase.co`)
   - la clave **anon / publishable** (es pública)
   - la clave **service_role / secret** (es secreta: solo va en Vercel, no la compartas con nadie)

### 2. Publicar en Vercel
1. En vercel.com: **Add New → Project**, elegí el repositorio `mi-patrimonio` y tocá **Import**.
2. Framework: **Other**. No hace falta comando de build.
3. En **Environment Variables** cargá:

   | Nombre | Valor |
   |---|---|
   | `SUPABASE_URL` | URL del proyecto |
   | `SUPABASE_ANON_KEY` | clave anon / publishable |
   | `SUPABASE_SERVICE_ROLE_KEY` | clave service_role / secret |
   | `ANTHROPIC_API_KEY` | *(opcional)* clave de la API de Claude, para entender texto libre con IA |

4. Tocá **Deploy**. Al terminar te da la dirección de la app.

### 3. Instalar en el iPhone
1. Abrí la dirección en **Safari** (tiene que ser Safari).
2. Tocá el botón **Compartir** → **Agregar a pantalla de inicio** → **Agregar**.
3. Abrí la app desde el ícono nuevo y tocá **Crear cuenta**.
   - Si Supabase te manda un email de confirmación, abrí el link, volvé a la app y tocá **Ingresar**.

### 4. Cerrar el registro (recomendado)
Después de crear tu cuenta, en Supabase andá a **Authentication → Sign In / Providers** y desactivá **Allow new users to sign up**. Así nadie más puede crearse una cuenta en tu app.

### 5. Pasar tus datos de la versión anterior
En la versión anterior (la de Claude): **Ajustes → Respaldo → Descargar respaldo completo (JSON)**. En la app nueva: **Más → Ajustes → Importar un respaldo** y elegí ese archivo. Los movimientos que ya existen no se duplican.

## Cómo funciona

- **Datos**: Supabase (PostgreSQL). Cada usuario ve solo lo suyo (políticas RLS). Los movimientos y cuentas no se borran: se anulan o archivan, y cada modificación guarda la versión anterior en `movimientos_historial`.
- **Importes**: en centavos enteros, nunca con decimales sueltos.
- **Sin conexión**: copia local en el teléfono (IndexedDB) y cola de cambios pendientes.
- **Dólar**: `/api/dolar` lee la cotización billete venta de bna.com.ar; si el sitio no responde, usa DolarAPI (oficial) como respaldo e indica la fuente. Se consulta al abrir la app y los días hábiles a las 20:30 UTC (17:30 en Argentina). Una cotización cargada a mano pisa a la automática del mismo día.
- **Texto libre**: sin `ANTHROPIC_API_KEY` usa un intérprete local. Con la clave usa Claude. En los dos casos el resultado se revisa antes de guardar y se valida en la app.

## Estructura

```
index.html            página principal (metadatos para iPhone)
app.js                lógica de la app
styles.css            estilos
sw.js                 funcionamiento sin conexión
manifest.webmanifest  datos de instalación
icons/                íconos
api/config.js         configuración pública de Supabase
api/dolar.js          dólar BNA automático
api/interpretar.js    texto libre con IA (opcional)
supabase/schema.sql   base de datos
vercel.json           trabajo programado y encabezados
```
