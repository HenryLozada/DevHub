# PersonalHub (DevHub)

Dashboard personal todo-en-uno: finanzas, tareas, calendario, DevHub de recursos y DevBot (IA).

## Stack

- Astro 7 + React 19 + Tailwind 4
- Supabase Auth + sync en la nube
- Persistencia local (`localStorage`) con respaldo/export
- Deploy: Vercel (adapter SSR)

## Desarrollo

```bash
npm install
cp .env.example .env
# Completa PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY y GROQ_API_KEY
npm run dev
```

## Scripts

- `npm run dev` — servidor local
- `npm run build` — build de producción
- `npm run check` — typecheck Astro
- `npm run lint` — ESLint
- `npm test` — tests (Vitest)
- `npm run preview` — preview del build

CI (GitHub Actions) ejecuta check, lint, test y build en cada push a `main` y en cada PR.

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Anon key (cliente) |
| `GROQ_API_KEY` | Clave privada de servidor para DevBot (nunca `PUBLIC_`) |

En Vercel: Settings → Environment Variables → `GROQ_API_KEY` (Sensitive).

## Supabase

Ejecuta `supabase-schema.sql` en el SQL Editor del proyecto (incluye `updated_at` y RLS). Es idempotente: vuelve a ejecutarlo cuando se agreguen tablas (p. ej. `devhub_vault`).

La sincronización hace merge por ítem (`lib/sync-merge.ts`): si editas en dos dispositivos se conservan los cambios de ambos, y los borrados se propagan.

## Seguridad

- Activa el **PIN** en DevHub → Seguridad: las contraseñas y API keys se cifran (AES-GCM) con una clave maestra protegida por el PIN (PBKDF2) y por el código de recuperación. Solo se sincroniza el material cifrado; el PIN nunca sale del dispositivo. Usa 6–8 dígitos.
- Sin PIN activo, las credenciales se guardan sin cifrar.
- DevBot **no** envía contraseñas ni API keys al modelo, y pide confirmación antes de eliminar datos.
- `/api/chat` y `/api/metadata` exigen sesión de Supabase válida y limitan solicitudes por usuario. `/api/metadata` bloquea IPs privadas en cada redirección.

## Limitaciones conocidas

- **Recordatorios con la app cerrada:** se programan dentro del service worker con `setTimeout`, y el navegador lo suspende cuando la app no está abierta. Para recibirlos siempre haría falta Web Push (VAPID) con un cron en el servidor.
