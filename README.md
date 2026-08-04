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
- `npm run preview` — preview del build

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Anon key (cliente) |
| `GROQ_API_KEY` | Clave privada de servidor para DevBot (nunca `PUBLIC_`) |

En Vercel: Settings → Environment Variables → `GROQ_API_KEY` (Sensitive).

## Supabase

Ejecuta `supabase-schema.sql` en el SQL Editor del proyecto (incluye `updated_at` y RLS).

## Seguridad

- Credenciales DevHub se guardan en local/cloud; activa el **PIN global** en DevHub → Seguridad.
- El PIN y el código de recuperación se almacenan hasheados (SHA-256).
- DevBot **no** envía contraseñas ni API keys al modelo.
- `/api/chat` y `/api/metadata` validan origen y limitan abuso.
